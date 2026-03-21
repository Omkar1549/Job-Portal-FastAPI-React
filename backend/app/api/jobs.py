from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.schemas.application import ApplicationOut
from app.api.auth import get_current_user, require_admin
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ── GET /jobs ─────────────────────────────────────────
@router.get("", response_model=List[JobOut])
def list_jobs(
    status: str = None,
    department: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all jobs with optional filters.
    Any authenticated user can view jobs.
    """
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if department:
        query = query.filter(Job.department == department)

    jobs = query.order_by(Job.created_at.desc()).all()

    # Enrich with application counts
    result = []
    for job in jobs:
        job_out = JobOut.model_validate(job)
        job_out.application_count = job.applications.count()
        job_out.screened_count = job.applications.filter(Application.is_screened == True).count()
        result.append(job_out)

    return result


# ── GET /jobs/:id ─────────────────────────────────────
@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ── POST /jobs ────────────────────────────────────────
@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),  # Admin only
):
    """
    Create a new job posting.
    Kicks off a background task to extract skills from the description using AI.
    """
    job = Job(
        title=job_data.title,
        description=job_data.description,
        department=job_data.department,
        location=job_data.location,
        employment_type=job_data.employment_type,
        created_by_id=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Extract required skills from JD in the background (non-blocking)
    background_tasks.add_task(
        ai_service.extract_job_skills,
        job_id=job.id,
        description=job_data.description,
        db=db,
    )

    return job


# ── PUT /jobs/:id ─────────────────────────────────────
@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for field, value in job_data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


# ── DELETE /jobs/:id ──────────────────────────────────
@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()


# ── GET /jobs/:id/applicants ──────────────────────────
@router.get("/{job_id}/applicants", response_model=List[ApplicationOut])
def get_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.applications.all()


# ── GET /jobs/:id/applicants/ranked ───────────────────
@router.get("/{job_id}/applicants/ranked", response_model=List[ApplicationOut])
def get_ranked_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return applicants sorted by AI match score (highest first).
    Unscreened applicants appear at the bottom.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    apps = (
        job.applications
        .order_by(
            Application.ai_match_score.desc().nullslast()
        )
        .all()
    )
    return apps


# ── POST /jobs/:id/analyze-all ────────────────────────
@router.post("/{job_id}/analyze-all")
async def bulk_analyze(
    job_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Queue AI analysis for all unscreened applicants of a job.
    Runs asynchronously so the response is immediate.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    unscreened = job.applications.filter(Application.is_screened == False).all()

    background_tasks.add_task(
        ai_service.bulk_analyze_applicants,
        applicants=unscreened,
        job=job,
        db=db,
    )

    return {
        "message": f"Bulk analysis started for {len(unscreened)} applicants",
        "processed_count": len(unscreened),
        "job_id": job_id,
    }