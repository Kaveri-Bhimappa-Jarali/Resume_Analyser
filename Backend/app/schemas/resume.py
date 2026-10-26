from pydantic import BaseModel, Field


class ResumeUploadResponse(BaseModel):
    resume_id: int
    filename: str
    extracted_text_status: str
    upload_status: str
    text_length: int = 0


class ResumeOut(BaseModel):
    id: int
    filename: str
    extracted_text: str | None = None
    created_at: str

    model_config = {"from_attributes": True}
