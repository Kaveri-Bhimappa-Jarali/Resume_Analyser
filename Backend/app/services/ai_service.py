from app.core.config import settings
from app.services.ai_provider import MockAIProvider, OpenAIProvider


class AIService:
    def __init__(self) -> None:
        self.provider = self._select_provider()

    def _select_provider(self):
        if settings.AI_PROVIDER.lower() == "openai" and settings.AI_API_KEY:
            return OpenAIProvider()
        return MockAIProvider()

    def analyze(self, resume_text: str, job_text: str | None = None) -> dict:
        prompt = self._build_prompt(resume_text, job_text)
        return self.provider.generate(prompt)

    def _build_prompt(self, resume_text: str, job_text: str | None = None) -> str:
        prompt = (
            "Analyze the resume text and provide an AI analysis JSON with keys: summary, strengths, weaknesses, "
            "missing_skills, keyword_suggestions, summary_rewrite, bullet_improvements, recommendations. "
            "Do not fabricate information. Use only text from the resume."
            f"\n\nResume Text:\n{resume_text}"
        )
        if job_text:
            prompt += f"\n\nJob Description:\n{job_text}"
        return prompt
