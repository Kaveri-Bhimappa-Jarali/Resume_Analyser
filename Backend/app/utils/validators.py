import mimetypes
import re
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import AppError

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def secure_filename(name: str) -> str:
    name = Path(name).name
    name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    return name[:180] or "resume"


def validate_upload(filename: str, content_type: str | None, size: int) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AppError("Only PDF and DOCX files are supported.", 400)

    guessed, _ = mimetypes.guess_type(filename)
    mime = content_type or guessed
    if mime and mime not in ALLOWED_MIME:
        raise AppError("Invalid file MIME type.", 400)

    if size <= 0:
        raise AppError("Uploaded file is empty.", 400)

    if size > settings.max_upload_bytes:
        raise AppError(
            f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
            400,
        )
