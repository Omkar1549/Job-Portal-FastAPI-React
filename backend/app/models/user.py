from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    admin     = "admin"
    recruiter = "recruiter"
    viewer    = "viewer"


class User(Base):
    """
    Represents a system user (HR team member, recruiter, or admin).
    NOT the job applicant — see Application model for that.
    """
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), unique=True, index=True, nullable=False)
    full_name    = Column(String(255), nullable=False)
    company      = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role         = Column(SAEnum(UserRole), default=UserRole.recruiter, nullable=False)
    is_active    = Column(Boolean, default=True)

    # Timestamps
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────
    # Jobs posted by this user
    jobs = relationship("Job", back_populates="created_by", lazy="dynamic")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"