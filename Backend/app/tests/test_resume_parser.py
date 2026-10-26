import os
from pathlib import Path

import pytest

from app.services.resume_parser import ResumeParser
from app.utils.text_cleaner import normalize_text


@pytest.fixture
def sample_pdf(tmp_path):
    sample_path = tmp_path / "resume.pdf"
    sample_path.write_text("Test resume PDF content.")
    return str(sample_path)


@pytest.fixture
def sample_docx(tmp_path):
    from docx import Document

    sample_path = tmp_path / "resume.docx"
    document = Document()
    document.add_paragraph("Test resume DOCX content.")
    document.save(sample_path)
    return str(sample_path)


def test_extract_text_docx(sample_docx):
    parser = ResumeParser()
    text = parser.extract_text(sample_docx)
    assert "Test resume DOCX content." in text


def test_extract_text_pdf(sample_pdf):
    parser = ResumeParser()
    with pytest.raises(Exception):
        parser.extract_text(sample_pdf)
