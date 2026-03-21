from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


# ── Request schemas (what the client sends) ───────────

class UserCreate(BaseModel):
    """Used for POST /auth/register"""
    email:     str        # ✅ EmailStr काढला — email_validator package नको
    full_name: str
    password:  str
    company:   Optional[str] = None
    role:      UserRole = UserRole.recruiter

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        # Simple email check without email_validator package
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()


class UserUpdate(BaseModel):
    """Used for PATCH /users/me"""
    full_name: Optional[str] = None
    company:   Optional[str] = None


# ── Response schemas (what the server returns) ────────

class UserOut(BaseModel):
    """Safe user representation — never exposes hashed_password."""
    id:         int
    email:      str
    full_name:  str
    company:    Optional[str]
    role:       UserRole
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Auth schemas ──────────────────────────────────────

class LoginResponse(BaseModel):
    """Returned by POST /auth/login"""
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


class TokenData(BaseModel):
    """Decoded JWT payload"""
    user_id: Optional[int] = None
    role:    Optional[str] = None