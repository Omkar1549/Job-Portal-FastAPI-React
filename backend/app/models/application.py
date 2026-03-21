from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class ApplicationStatus(str, enum.Enum):
    pending     = "pending"
    reviewed    = "reviewed"
    shortlisted = "shortlisted"
    rejected    = "rejected"
    hired       = "hired"


class Application(Base):
    """
    Represents a candidate's application for a specific job.

    Stores:
    - Candidate personal info (name, email, phone)
    - Uploaded resume PDF path (stored in /uploads)
    - AI analysis results (score, analysis text, skill breakdown)
    - Manual status set by recruiter
    """
    __tablename__ = "applications"

    id         = Column(Integer, primary_key=True, index=True)
    job_id     = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)

    # ── Candidate info ─────────────────────────────
    full_name  = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, index=True)
    phone      = Column(String(50), nullable=True)

    # ── Resume ─────────────────────────────────────
    # Relative path under UPLOADS_DIR, e.g. "2024/01/resume_abc123.pdf"
    resume_path    = Column(String(500), nullable=True)
    resume_text    = Column(Text, nullable=True)  # Extracted text from PDF

    # ── AI Analysis (populated by ai_service.py) ──
    ai_match_score   = Column(Float, nullable=True)     # 0–100
    ai_analysis      = Column(Text, nullable=True)      # Full Gemini response
    ai_skill_matched = Column(Text, nullable=True)      # JSON array: matched skills
    ai_skill_partial = Column(Text, nullable=True)      # JSON array: partial skills
    ai_skill_missing = Column(Text, nullable=True)      # JSON array: missing skills
    is_screened      = Column(Boolean, default=False)   # True after AI analysis ran

    # ── Recruiter decision ─────────────────────────
    status     = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.pending, index=True)
    notes      = Column(Text, nullable=True)            # Recruiter's internal notes

    # Timestamps
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────
    job = relationship("Job", back_populates="applications")

    def __repr__(self):
        return f"<Application id={self.id} name={self.full_name!r} score={self.ai_match_score}>"