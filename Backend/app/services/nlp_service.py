import re
from typing import Any

import spacy

from app.utils.text_cleaner import normalize_text


class NLPService:
    def __init__(self) -> None:
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            import sys

            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
            self.nlp = spacy.load("en_core_web_sm")

    def extract_candidates(self, text: str) -> list[str]:
        text = normalize_text(text)
        doc = self.nlp(text)
        return [ent.text for ent in doc.ents if ent.label_ in {"ORG", "PRODUCT", "WORK_OF_ART", "SKILL", "LANGUAGE"}]

    def find_email(self, text: str) -> str | None:
        match = re.search(r"[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}", text)
        return match.group(0) if match else None

    def find_phone(self, text: str) -> str | None:
        match = re.search(r"\+?\d[\d\s\-()]{7,}\d", text)
        return match.group(0).strip() if match else None
