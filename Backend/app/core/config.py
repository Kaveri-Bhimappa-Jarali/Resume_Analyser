from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./resume_analyzer.db"
    SECRET_KEY: str = Field(..., env=["SECRET_KEY", "JWT_SECRET"])
    AI_PROVIDER: str = "mock"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    MAX_UPLOAD_SIZE_MB: int = 5
    UPLOAD_DIR: str = "./uploads"
    LOG_LEVEL: str = "INFO"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    ATS_WEIGHTS: dict = {
        "keyword_match": 0.25,
        "skills_match": 0.20,
        "structure": 0.15,
        "section_completeness": 0.10,
        "experience_relevance": 0.10,
        "education_relevance": 0.10,
        "formatting": 0.05,
        "readability": 0.05,
    }

    SCORE_THRESHOLDS: dict = {
        "excellent": 85,
        "good": 70,
        "needs_improvement": 50,
    }

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
