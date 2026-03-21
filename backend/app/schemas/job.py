from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.job import EmploymentType, JobStatus


class JobCreate(BaseModel):
    title:           str
    description:     str
    department:      Optional[str] = None
    location:        Optional[str] = None
    employment_type: EmploymentType = EmploymentType.full_time


class JobUpdate(BaseModel):
    title:           Optional[str] = None
    description:     Optional[str] = None
    department:      Optional[str] = None
    location:        Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    status:          Optional[JobStatus] = None


class JobOut(BaseModel):
    id:               int
    title:            str
    description:      str
    department:       Optional[str]
    location:         Optional[str]
    employment_type:  EmploymentType
    status:           JobStatus
    extracted_skills: Optional[str]
    created_by_id:    int
    application_count: int = 0
    screened_count:    int = 0
    created_at:       datetime

    model_config = {"from_attributes": True}