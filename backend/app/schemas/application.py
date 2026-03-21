from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    """Used when a candidate submits an application (without file)."""
    job_id:    int
    full_name: str
    email:     EmailStr
    phone:     Optional[str] = None


class ApplicationUpdate(BaseModel):
    """Used by recruiter to update status or add notes."""
    status: Optional[ApplicationStatus] = None
    notes:  Optional[str] = None


class SkillBreakdown(BaseModel):
    matched: List[str] = []
    partial: List[str] = []
    missing: List[str] = []


class AIAnalysisResult(BaseModel):
    """Returned after Gemini analysis completes."""
    score:           float
    analysis:        str
    skill_breakdown: Optional[SkillBreakdown] = None
    recommendation:  Optional[str] = None


class ApplicationOut(BaseModel):
    id:              int
    job_id:          int
    full_name:       str
    email:           str
    phone:           Optional[str]
    resume_path:     Optional[str]
    ai_match_score:  Optional[float]
    ai_analysis:     Optional[str]
    is_screened:     bool
    status:          ApplicationStatus
    notes:           Optional[str]
    applied_at:      datetime

    model_config = {"from_attributes": True}