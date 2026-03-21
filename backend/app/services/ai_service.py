import json
import re
import asyncio
from typing import Optional, List

from app.core.config import settings
from app.schemas.application import AIAnalysisResult, SkillBreakdown


class AIService:
    """
    Handles all Gemini AI API calls for TalentAI.

    Responsibilities:
    1. analyze_candidate()   — Score a resume against a job description
    2. extract_job_skills()  — Extract required skills from a JD
    3. bulk_analyze_applicants() — Queue analysis for multiple applicants
    """

    def __init__(self):
        self._model = None

    @property
    def model(self):
        """Lazy-load the Gemini model (only initialize on first use)."""
        if self._model is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._model = genai.GenerativeModel("gemini-1.5-flash")
            except ImportError:
                raise RuntimeError(
                    "google-generativeai not installed. "
                    "Run: pip install google-generativeai"
                )
            except Exception as e:
                raise RuntimeError(f"Failed to initialize Gemini: {e}")
        return self._model

    # ── analyze_candidate ─────────────────────────────
    async def analyze_candidate(
        self,
        resume_text: str,
        job_description: str,
        job_title: str,
        extracted_skills: Optional[str] = None,
    ) -> AIAnalysisResult:
        """
        Core AI function: Evaluates how well a candidate matches a job.

        Prompts Gemini with:
        - The full job description (and extracted skills if available)
        - The candidate's resume text

        Returns a structured AIAnalysisResult with:
        - score (0-100 float)
        - analysis (human-readable explanation)
        - skill_breakdown (matched / partial / missing skills)
        - recommendation (priority level)

        The prompt is carefully engineered to always return valid JSON
        so we can parse it reliably.
        """
        prompt = self._build_analysis_prompt(
            resume_text, job_description, job_title, extracted_skills
        )

        # Gemini is synchronous — run in a thread pool to not block FastAPI's event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.model.generate_content(prompt)
        )

        return self._parse_analysis_response(response.text)

    def _build_analysis_prompt(
        self,
        resume_text: str,
        job_description: str,
        job_title: str,
        extracted_skills: Optional[str],
    ) -> str:
        skills_section = f"\n\nKEY REQUIRED SKILLS: {extracted_skills}" if extracted_skills else ""

        return f"""You are an expert technical recruiter. Evaluate how well this candidate matches the job.

JOB TITLE: {job_title}

JOB DESCRIPTION:
{job_description}{skills_section}

CANDIDATE RESUME:
{resume_text[:8000]}  # Truncate to stay within token limits

---
Analyze the candidate's fit and respond ONLY with a valid JSON object in this exact format:
{{
  "score": <number 0-100>,
  "analysis": "<2-3 paragraph analysis of fit, strengths, and gaps>",
  "skill_breakdown": {{
    "matched": ["<skill1>", "<skill2>"],
    "partial": ["<skill3>"],
    "missing": ["<skill4>", "<skill5>"]
  }},
  "recommendation": "<one of: 'Priority Interview', 'Consider', 'Skip'>"
}}

Rules:
- score 80-100: Strong match, priority candidate
- score 60-79: Good match, worth interviewing
- score 40-59: Partial match, consider if pipeline is small
- score 0-39: Poor match, significant gaps
- Be specific and honest — this helps recruiters make real decisions
- Only include skills actually mentioned or clearly implied in the resume
"""

    def _parse_analysis_response(self, response_text: str) -> AIAnalysisResult:
        """
        Parse Gemini's response into a structured AIAnalysisResult.
        Handles cases where the model wraps JSON in markdown code blocks.
        """
        # Strip markdown code blocks if present
        text = response_text.strip()
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = text.strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Fallback: extract JSON from response with regex
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                # Complete fallback — return a safe error result
                return AIAnalysisResult(
                    score=0.0,
                    analysis="Analysis failed: Could not parse AI response. Please retry.",
                    recommendation="Error",
                )

        # Build skill breakdown
        breakdown_data = data.get("skill_breakdown", {})
        breakdown = SkillBreakdown(
            matched=breakdown_data.get("matched", []),
            partial=breakdown_data.get("partial", []),
            missing=breakdown_data.get("missing", []),
        )

        return AIAnalysisResult(
            score=float(data.get("score", 0)),
            analysis=data.get("analysis", ""),
            skill_breakdown=breakdown,
            recommendation=data.get("recommendation"),
        )

    # ── extract_job_skills ────────────────────────────
    async def extract_job_skills(
        self,
        job_id: int,
        description: str,
        db,  # SQLAlchemy Session
    ) -> None:
        """
        Extract required skills from a job description.
        Runs as a background task after job creation.
        Saves extracted skills back to the Job record.
        """
        prompt = f"""Extract the key required technical and professional skills from this job description.
Return ONLY a comma-separated list of skills, nothing else.
Maximum 15 skills.

Job Description:
{description}"""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(prompt)
            )
            skills = response.text.strip()

            # Save back to the job record
            from app.models.job import Job
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.extracted_skills = skills
                db.commit()

        except Exception as e:
            print(f"Error extracting skills for job {job_id}: {e}")

    # ── bulk_analyze_applicants ───────────────────────
    async def bulk_analyze_applicants(
        self,
        applicants: List,
        job,
        db,
    ) -> None:
        """
        Analyze multiple applicants sequentially.
        Adds a small delay between calls to avoid rate limiting.

        Called as a background task from POST /jobs/:id/analyze-all.
        """
        import json as json_module

        for applicant in applicants:
            if not applicant.resume_text:
                continue

            try:
                result = await self.analyze_candidate(
                    resume_text=applicant.resume_text,
                    job_description=job.description,
                    job_title=job.title,
                    extracted_skills=job.extracted_skills,
                )

                applicant.ai_match_score   = result.score
                applicant.ai_analysis      = result.analysis
                applicant.is_screened      = True

                if result.skill_breakdown:
                    applicant.ai_skill_matched = json_module.dumps(result.skill_breakdown.matched)
                    applicant.ai_skill_partial = json_module.dumps(result.skill_breakdown.partial)
                    applicant.ai_skill_missing = json_module.dumps(result.skill_breakdown.missing)

                db.commit()

                # Rate limit buffer — Gemini free tier: 15 req/min
                await asyncio.sleep(1)

            except Exception as e:
                print(f"Error analyzing applicant {applicant.id}: {e}")
                continue


# ── Singleton instance ────────────────────────────────
ai_service = AIService()