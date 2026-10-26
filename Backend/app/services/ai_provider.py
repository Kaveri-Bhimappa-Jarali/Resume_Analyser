import json
from abc import ABC, abstractmethod
from typing import Any

import openai

from app.core.config import settings


class AIProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> dict[str, Any]:
        raise NotImplementedError()


class MockAIProvider(AIProvider):
    def generate(self, prompt: str) -> dict[str, Any]:
        return {
            "summary": "The resume demonstrates relevant skills and experience, but can improve by clarifying project impact and adding quantifiable results.",
            "strengths": [
                "Relevant technical skills were identified.",
                "Experience and education sections are present.",
            ],
            "weaknesses": [
                "The resume could include more measurable outcomes.",
                "Some job-specific keywords are missing.",
            ],
            "missing_skills": [],
            "keyword_suggestions": [],
            "summary_rewrite": "",
            "bullet_improvements": [],
            "recommendations": [
                "Add specific accomplishments with metrics.",
                "Use clear section headings for better ATS parsing.",
            ],
            "provider": "mock",
        }


class OpenAIProvider(AIProvider):
    def __init__(self) -> None:
        openai.api_key = settings.AI_API_KEY
        if settings.OPENAI_BASE_URL:
            openai.api_base = settings.OPENAI_BASE_URL

    def generate(self, prompt: str) -> dict[str, Any]:
        response = openai.ChatCompletion.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": "You will respond with JSON only. Respond with valid JSON and no markdown."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return MockAIProvider().generate(prompt)
