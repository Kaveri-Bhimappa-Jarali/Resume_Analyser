from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.exceptions import AppError
from app.db.database import get_db
from app.db.models import JobDescription
from app.schemas.common import APIResponse
from app.schemas.job import JobCreate, JobOut

router = APIRouter()


@router.post("/", response_model=APIResponse[JobOut])
def create_job(payload: JobCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    job = JobDescription(user_id=current_user.id, title=payload.title.strip(), description=payload.description.strip())
    db.add(job)
    db.commit()
    db.refresh(job)
    return APIResponse(data=JobOut.from_orm(job), message="Job description saved.")


@router.get("/", response_model=APIResponse[list[JobOut]])
def list_jobs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(JobDescription).filter(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc()).all()
    return APIResponse(data=[JobOut.from_orm(job) for job in jobs], message="Job descriptions loaded.")


@router.get("/{job_id}", response_model=APIResponse[JobOut])
def get_job(job_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id, JobDescription.user_id == current_user.id).first()
    if not job:
        raise AppError("Job description not found.", status_code=404)
    return APIResponse(data=JobOut.from_orm(job), message="Job description loaded.")
