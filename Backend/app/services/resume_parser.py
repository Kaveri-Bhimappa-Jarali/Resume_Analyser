import fitz
from docx import Document
from pathlib import Path

from app.utils.text_cleaner import normalize_text, contains_meaningful_text


class ResumeParser:
    def extract_text(self, file_path: str) -> str:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError("Uploaded resume file was not found.")

        if path.suffix.lower() == ".pdf":
            return self._extract_pdf(path)
        if path.suffix.lower() == ".docx":
            return self._extract_docx(path)

        raise ValueError("Unsupported resume file type.")

    def _extract_pdf(self, path: Path) -> str:
        try:
            with fitz.open(path) as document:
                text = "\n\n".join(page.get_text("text") for page in document)
        except Exception as exc:
            raise ValueError("Failed to extract text from PDF.") from exc
        return normalize_text(text)

    def _extract_docx(self, path: Path) -> str:
        try:
            document = Document(path)
            text = "\n\n".join(paragraph.text for paragraph in document.paragraphs)
        except Exception as exc:
            raise ValueError("Failed to extract text from DOCX.") from exc
        return normalize_text(text)

    def is_valid_text(self, text: str) -> bool:
        return contains_meaningful_text(text)
