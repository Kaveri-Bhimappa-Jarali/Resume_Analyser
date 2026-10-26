from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.exceptions import AppError
from app.db.database import get_db
from app.db.models import Analysis, JobDescription, Resume
from app.schemas.analysis import AnalysisRequest, AnalysisResult, AnalysisSummary
from app.schemas.common import APIResponse
from app.services.analyzer import Analyzer

router = APIRouter()


@router.post("/{resume_id}", response_model=APIResponse[AnalysisResult])
def analyze_resume(
    resume_id: int,
    payload: AnalysisRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise AppError("Resume not found.", status_code=404)

    job_text = None
    job = None
    if payload.job_id is not None:
        job = db.query(JobDescription).filter(JobDescription.id == payload.job_id, JobDescription.user_id == current_user.id).first()
        if not job:
            raise AppError("Job description not found.", status_code=404)
        job_text = job.description
    elif payload.job_description:
        job_text = payload.job_description

    analyzer = Analyzer(resume.extracted_text or "", job_text)
    report = analyzer.report()
    if job:
        report["skills"]["recommended"] = [skill for skill in (job_text or "").split() if skill.lower() not in [s.lower() for s in analyzer.skills]][:10]

    analysis = Analysis(
        resume_id=resume.id,
        job_id=job.id if job else None,
        overall_score=report["overall_score"],
        ats_score=report["ats_score"],
        job_match_score=report["job_match_score"] or 0.0,
        result_json=json.dumps(report),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return APIResponse(data=AnalysisResult(**report), message="Analysis completed successfully.")


@router.get("/{analysis_id}", response_model=APIResponse[AnalysisSummary])
def get_analysis(analysis_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    analysis = (
        db.query(Analysis)
        .join(Resume)
        .filter(Analysis.id == analysis_id, Resume.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise AppError("Analysis record not found.", status_code=404)

    return APIResponse(data=AnalysisSummary.from_orm(analysis), message="Analysis retrieved successfully.")
