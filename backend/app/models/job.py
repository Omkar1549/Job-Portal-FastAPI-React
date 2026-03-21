from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class EmploymentType(str, enum.Enum):
    full_time  = "full-time"
    part_time  = "part-time"
    contract   = "contract"
    internship = "internship"
    remote     = "remote"


class JobStatus(str, enum.Enum):
    active  = "active"
    paused  = "paused"
    closed  = "closed"


class Job(Base):
    """
    Represents a job posting created by a recruiter or admin.
    """
    __tablename__ = "jobs"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String(255), nullable=False, index=True)
    description     = Column(Text, nullable=False)
    department      = Column(String(100), nullable=True)
    location        = Column(String(100), nullable=True)
    employment_type = Column(SAEnum(EmploymentType), default=EmploymentType.full_time)
    status          = Column(SAEnum(JobStatus), default=JobStatus.active, index=True)

    # AI-extracted requirements (stored as comma-separated string for simplicity,
    # or use JSONB on PostgreSQL for production)
    extracted_skills = Column(Text, nullable=True)

    # FK to user who posted the job
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────
    created_by   = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan", lazy="dynamic")

    @property
    def application_count(self) -> int:
        return self.applications.count()

    @property
    def screened_count(self) -> int:
        return self.applications.filter_by(is_screened=True).count()

    def __repr__(self):
        return f"<Job id={self.id} title={self.title!r} status={self.status}>"