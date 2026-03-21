import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.application import Application
from app.models.job import Job
from app.schemas.application import ApplicationOut, ApplicationUpdate, AIAnalysisResult
from app.api.auth import get_current_user
from app.models.user import User
from app.services.pdf_service import pdf_service
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter(prefix="/applicants", tags=["Applicants"])


# ── POST /applicants/apply ────────────────────────────
@router.post("/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    job_id:    int     = Form(...),
    full_name: str     = Form(...),
    email:     str     = Form(...),
    phone:     str     = Form(None),
    resume:    UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Candidates submit their application + resume PDF here.

    Workflow:
    1. Validate job exists and is active
    2. Check max file size
    3. Save PDF to uploads/
    4. Extract text from PDF using pdf_service
    5. Create Application record in DB
    """
    # Validate job
    job = db.query(Job).filter(Job.id == job_id, Job.status == "active").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer accepting applications")

    # Validate file type
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Validate file size
    content = await resume.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit"
        )

    # Save PDF with unique filename to prevent collisions
    filename = f"{uuid.uuid4().hex}_{resume.filename}"
    save_path = os.path.join(settings.UPLOADS_DIR, filename)
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(content)

    # Extract text from PDF
    resume_text = pdf_service.extract_text(save_path)

    # Create application record
    application = Application(
        job_id=job_id,
        full_name=full_name,
        email=email,
        phone=phone,
        resume_path=filename,
        resume_text=resume_text,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


# ── GET /applicants/:id ───────────────────────────────
@router.get("/{applicant_id}", response_model=ApplicationOut)
def get_applicant(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


# ── PATCH /applicants/:id ─────────────────────────────
@router.patch("/{applicant_id}", response_model=ApplicationOut)
def update_applicant(
    applicant_id: int,
    update_data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update application status or recruiter notes."""
    app = db.query(Application).filter(Application.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)
    return app


# ── POST /applicants/:id/analyze ─────────────────────
@router.post("/{applicant_id}/analyze", response_model=AIAnalysisResult)
async def analyze_applicant(
    applicant_id: int,
    payload: dict,          # {"job_id": int}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run Gemini AI analysis on a single applicant.

    Workflow:
    1. Fetch applicant and job records
    2. Build prompt from resume text + job description
    3. Call Gemini API via ai_service
    4. Parse response → score, analysis, skill breakdown
    5. Save results to DB
    6. Return AIAnalysisResult
    """
    application = db.query(Application).filter(Application.id == applicant_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job_id = payload.get("job_id")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not application.resume_text:
        raise HTTPException(
            status_code=400,
            detail="No resume text available. The PDF may not have been parsed correctly."
        )

    # Run AI analysis
    result = await ai_service.analyze_candidate(
        resume_text=application.resume_text,
        job_description=job.description,
        job_title=job.title,
        extracted_skills=job.extracted_skills,
    )

    # Persist results to DB
    import json
    application.ai_match_score   = result.score
    application.ai_analysis      = result.analysis
    application.is_screened      = True
    if result.skill_breakdown:
        application.ai_skill_matched = json.dumps(result.skill_breakdown.matched)
        application.ai_skill_partial = json.dumps(result.skill_breakdown.partial)
        application.ai_skill_missing = json.dumps(result.skill_breakdown.missing)

    db.commit()
    return result


# ── GET /applicants/:id/analysis ─────────────────────
@router.get("/{applicant_id}/analysis", response_model=AIAnalysisResult)
def get_analysis(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return previously computed AI analysis for an applicant."""
    import json
    app = db.query(Application).filter(Application.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if not app.is_screened:
        raise HTTPException(status_code=404, detail="Application has not been analyzed yet")

    from app.schemas.application import SkillBreakdown
    breakdown = None
    if app.ai_skill_matched:
        breakdown = SkillBreakdown(
            matched=json.loads(app.ai_skill_matched or "[]"),
            partial=json.loads(app.ai_skill_partial or "[]"),
            missing=json.loads(app.ai_skill_missing or "[]"),
        )

    return AIAnalysisResult(
        score=app.ai_match_score,
        analysis=app.ai_analysis,
        skill_breakdown=breakdown,
    )