import re
from collections import Counter
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings
from app.services.skills import flatten_skills, SKILL_CATEGORIES
from app.utils.text_cleaner import normalize_text

SECTION_PATTERNS = {
    "summary": [r"summary", r"professional summary", r"profile", r"about me", r"objective"],
    "experience": [r"experience", r"work experience", r"professional experience", r"employment history"],
    "education": [r"education", r"academic", r"qualifications"],
    "projects": [r"projects", r"project experience", r"personal projects"],
    "skills": [r"skills", r"technical skills", r"skill set", r"expertise"],
    "certifications": [r"certifications", r"certified", r"licenses"],
    "achievements": [r"achievements", r"accomplishments", r"honors"],
}


class Analyzer:
    def __init__(self, resume_text: str, job_text: str | None = None):
        self.resume_text = normalize_text(resume_text)
        self.job_text = normalize_text(job_text or "")
        self.sections = self._detect_sections(self.resume_text)
        self.skills = self._extract_skills(self.resume_text)
        self.keywords = self._extract_keywords(self.resume_text)
        self.quality_issues = self._detect_quality_issues()

    def _detect_sections(self, text: str) -> list[dict[str, Any]]:
        normalized = text.lower()
        sections = []
        for name, patterns in SECTION_PATTERNS.items():
            found = any(re.search(pattern, normalized) for pattern in patterns)
            preview = ""
            if found:
                preview_match = re.search(rf"({patterns[0]}.{{0,120}})", normalized)
                preview = preview_match.group(0) if preview_match else ""
            sections.append({"name": name, "found": found, "content_preview": preview})
        return sections

    def _extract_skills(self, text: str) -> list[str]:
        tokens = re.findall(r"[a-zA-Z+#\.]+", text.lower())
        skills = set()
        for skill in flatten_skills(SKILL_CATEGORIES):
            normalized_skill = skill.lower()
            if normalized_skill in text.lower():
                skills.add(skill)
            elif "+" in skill and skill in text.lower():
                skills.add(skill)
        return sorted(skills)

    def _extract_keywords(self, text: str) -> dict[str, list[str]]:
        candidate_keywords = [
            "python", "java", "react", "node", "fastapi", "django", "sql", "aws", "docker", "kubernetes",
            "leadership", "communication", "machine learning", "nlp", "api", "cloud", "testing",
        ]
        found = [kw for kw in candidate_keywords if kw in text.lower()]
        return {"detected": found}

    def _detect_quality_issues(self) -> list[str]:
        issues = []
        if len(self.resume_text.split()) < 150:
            issues.append("Resume appears short. Consider adding more detail about technical experience.")
        if self.resume_text.count("\n\n") < 3:
            issues.append("Resume formatting may lack clear sections.")
        if "curriculum vitae" in self.resume_text.lower():
            issues.append("Use the term 'Resume' or keep section headings concise.")
        return issues

    def score_ats(self) -> float:
        skill_match = min(len(self.skills) / max(len(flatten_skills(SKILL_CATEGORIES)), 1), 1.0)
        keyword_match = min(len(self.keywords["detected"]) / 10.0, 1.0)
        structure = sum(1 for section in self.sections if section["found"]) / len(self.sections)
        experience = 1.0 if any(section["name"] == "experience" and section["found"] for section in self.sections) else 0.0
        education = 1.0 if any(section["name"] == "education" and section["found"] for section in self.sections) else 0.0
        formatting = 1.0 if self.resume_text.count("\n\n") >= 3 else 0.5
        readability = 1.0 if len(self.resume_text.split()) >= 200 else 0.6

        weights = settings.ATS_WEIGHTS
        score = (
            weights["keyword_match"] * keyword_match
            + weights["skills_match"] * skill_match
            + weights["structure"] * structure
            + weights["section_completeness"] * structure
            + weights["experience_relevance"] * experience
            + weights["education_relevance"] * education
            + weights["formatting"] * formatting
            + weights["readability"] * readability
        ) * 100
        return round(score, 1)

    def score_overall(self) -> float:
        ats = self.score_ats()
        quality = 1.0 - min(len(self.quality_issues) / 5.0, 1.0)
        project = 1.0 if any(section["name"] == "projects" and section["found"] for section in self.sections) else 0.0
        overall = 0.6 * (ats / 100.0) + 0.3 * quality + 0.1 * project
        return round(overall * 100, 1)

    def job_match(self) -> dict[str, Any]:
        if not self.job_text:
            return {"score": None, "matched": [], "missing": [], "partial": []}

        combined = [self.resume_text, self.job_text]
        vectorizer = TfidfVectorizer(stop_words="english")
        vectors = vectorizer.fit_transform(combined)
        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        job_skills = [skill for skill in flatten_skills(SKILL_CATEGORIES) if skill in self.job_text.lower()]
        matched = [skill for skill in job_skills if skill in self.skills]
        missing = [skill for skill in job_skills if skill not in self.skills]
        partial = []
        return {
            "score": round(similarity * 100, 1),
            "matched": sorted(matched),
            "missing": sorted(missing),
            "partial": partial,
        }

    def rating_label(self, score: float) -> str:
        thresholds = settings.SCORE_THRESHOLDS
        if score >= thresholds["excellent"]:
            return "Excellent"
        if score >= thresholds["good"]:
            return "Good"
        if score >= thresholds["needs_improvement"]:
            return "Needs Improvement"
        return "Major Improvements Recommended"

    def report(self) -> dict[str, Any]:
        ats = self.score_ats()
        overall = self.score_overall()
        job_data = self.job_match()
        return {
            "overall_score": overall,
            "overall_rating": self.rating_label(overall),
            "overall_explanation": "Calculated from ATS compatibility, skills, structure, and resume quality.",
            "ats_score": ats,
            "ats_label": "Estimated ATS Compatibility Score",
            "ats_breakdown": {
                "keyword_match": {"score": round(min(len(self.keywords["detected"]) / 10.0, 1.0) * 100, 1), "explanation": "Keywords detected in resume.", "recommendation": "Add missing industry keywords from the job description."},
                "skills_match": {"score": round(min(len(self.skills) / max(len(flatten_skills(SKILL_CATEGORIES)), 1), 1.0) * 100, 1), "explanation": "Technical skills detected.", "recommendation": "Include relevant skills and technologies used."},
                "structure": {"score": round(sum(1 for s in self.sections if s["found"]) / len(self.sections) * 100, 1), "explanation": "Section headings and organization.", "recommendation": "Use standard headings like Experience, Education, Skills."},
                "section_completeness": {"score": round(sum(1 for s in self.sections if s["found"]) / len(self.sections) * 100, 1), "explanation": "Section coverage of key resume areas.", "recommendation": "Add missing sections such as Projects or Certifications."},
                "experience_relevance": {"score": 100.0 if any(s["name"] == "experience" and s["found"] for s in self.sections) else 0.0, "explanation": "Experience section presence.", "recommendation": "Add or expand your work experience section."},
                "education_relevance": {"score": 100.0 if any(s["name"] == "education" and s["found"] for s in self.sections) else 0.0, "explanation": "Education section presence.", "recommendation": "Include your academic qualifications."},
                "formatting": {"score": 100.0 if self.resume_text.count("\n\n") >= 3 else 50.0, "explanation": "Paragraph and section spacing.", "recommendation": "Use whitespace and bullets for readability."},
                "readability": {"score": 100.0 if len(self.resume_text.split()) >= 200 else 60.0, "explanation": "Document length and readability.", "recommendation": "Add clarity and more concrete examples."},
            },
            "job_match_score": job_data["score"],
            "skills": {
                "matched": job_data["matched"],
                "missing": job_data["missing"],
                "partial": job_data["partial"],
                "detected": self.skills,
                "recommended": [],
            },
            "sections": [
                {"name": section["name"], "found": section["found"], "content_preview": section["content_preview"]}
                for section in self.sections
            ],
            "keywords": self.keywords,
            "quality_issues": self.quality_issues,
            "suggestions": [
                {"priority": "HIGH", "title": "Add missing job-specific skills.", "reason": "The resume is missing some skills mentioned in the job description."}
            ],
            "ai": {"summary": "Deterministic analysis completed.", "strengths": [], "weaknesses": [], "missing_skills": [], "keyword_suggestions": [], "summary_rewrite": "", "bullet_improvements": [], "recommendations": [], "provider": "deterministic"},
            "contact_info": {"email": "@" in self.resume_text, "phone": any(ch.isdigit() for ch in self.resume_text), "linkedin": "linkedin.com" in self.resume_text.lower(), "github": "github.com" in self.resume_text.lower()},
        }
