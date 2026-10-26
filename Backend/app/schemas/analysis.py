from pydantic import BaseModel, Field


class CategoryScore(BaseModel):
    score: float
    explanation: str
    recommendation: str = ""


class SkillMatchResult(BaseModel):
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    partial: list[str] = Field(default_factory=list)
    detected: list[str] = Field(default_factory=list)
    recommended: list[str] = Field(default_factory=list)


class SectionAnalysis(BaseModel):
    name: str
    found: bool
    content_preview: str = ""


class SuggestionItem(BaseModel):
    priority: str
    title: str
    reason: str


class BulletImprovement(BaseModel):
    original: str
    improved: str
    rationale: str


class AIAnalysisResult(BaseModel):
    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    keyword_suggestions: list[str] = Field(default_factory=list)
    summary_rewrite: str = ""
    bullet_improvements: list[BulletImprovement] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    provider: str = "deterministic"


class AnalysisResult(BaseModel):
    overall_score: float
    overall_rating: str
    overall_explanation: str
    ats_score: float
    ats_label: str = "Estimated ATS Compatibility Score"
    ats_breakdown: dict[str, CategoryScore]
    job_match_score: float | None = None
    skills: SkillMatchResult
    sections: list[SectionAnalysis]
    keywords: dict[str, list[str]]
    quality_issues: list[str]
    suggestions: list[SuggestionItem]
    ai: AIAnalysisResult
    contact_info: dict[str, bool]


class AnalysisRequest(BaseModel):
    job_id: int | None = None
    job_description: str | None = None
    job_title: str | None = None


class AnalysisSummary(BaseModel):
    id: int
    resume_id: int
    job_id: int | None
    overall_score: float
    ats_score: float
    job_match_score: float
    created_at: str

    model_config = {"from_attributes": True}
