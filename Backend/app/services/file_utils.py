from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def save_upload_file(filename: str, content: bytes) -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid4().hex}_{filename}"
    path = upload_dir / unique_name
    path.write_bytes(content)
    return path
