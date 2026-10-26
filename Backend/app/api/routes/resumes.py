from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.exceptions import AppError
from app.db.database import get_db
from app.db.models import Resume
from app.schemas.common import APIResponse
from app.schemas.resume import ResumeOut, ResumeUploadResponse
from app.services.resume_parser import ResumeParser
from app.utils.validators import secure_filename, validate_upload
from app.services.file_utils import save_upload_file

router = APIRouter()


@router.post("/upload", response_model=APIResponse[ResumeUploadResponse])
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    validate_upload(file.filename, file.content_type, len(content))
    filename = secure_filename(file.filename)
    upload_path = save_upload_file(filename, content)

    parser = ResumeParser()
    extracted_text = parser.extract_text(upload_path)
    if not parser.is_valid_text(extracted_text):
        raise AppError("Unable to extract readable text from the resume. Please upload a different file.", 400)

    resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=str(upload_path),
        extracted_text=extracted_text,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return APIResponse(
        data=ResumeUploadResponse(
            resume_id=resume.id,
            filename=resume.filename,
            extracted_text_status="success",
            upload_status="uploaded",
            text_length=len(extracted_text),
        ),
        message="Resume uploaded and parsed successfully.",
    )


@router.get("/", response_model=APIResponse[list[ResumeOut]])
def list_resumes(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return APIResponse(data=[ResumeOut.from_orm(r) for r in resumes], message="Resume history loaded.")


@router.get("/{resume_id}", response_model=APIResponse[ResumeOut])
def get_resume(resume_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise AppError("Resume not found.", status_code=404)
    return APIResponse(data=ResumeOut.from_orm(resume), message="Resume found.")
