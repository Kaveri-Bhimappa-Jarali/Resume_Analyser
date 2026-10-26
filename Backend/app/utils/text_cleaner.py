import json
import re
import unicodedata
from pathlib import Path

SKILLS_PATH = Path(__file__).resolve().parents[1] / "data" / "skills.json"


def load_skills_db() -> dict[str, list[str]]:
    with open(SKILLS_PATH, encoding="utf-8") as f:
        return json.load(f)


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z+#.]+", text.lower())


def contains_meaningful_text(text: str, min_length: int = 80) -> bool:
    cleaned = re.sub(r"\s+", "", text or "")
    return len(cleaned) >= min_length
