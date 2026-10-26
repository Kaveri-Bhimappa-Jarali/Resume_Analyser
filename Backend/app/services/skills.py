from typing import Iterable

SKILL_CATEGORIES = {
    "programming_languages": [
        "python", "java", "c", "c++", "javascript", "typescript", "go", "ruby", "php", "swift", "kotlin",
    ],
    "frameworks": [
        "react", "angular", "vue", "django", "flask", "fastapi", "spring boot", "express", "node.js", "next.js", "nest.js",
    ],
    "databases": [
        "mysql", "postgresql", "mongodb", "sqlite", "oracle", "sql server", "redis", "cassandra",
    ],
    "cloud": ["aws", "azure", "gcp", "google cloud", "docker", "kubernetes"],
    "tools": ["git", "github", "gitlab", "jira", "postman", "docker", "jenkins", "circleci"],
    "ai_ml": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "opencv", "pandas", "numpy"],
    "soft_skills": ["communication", "teamwork", "leadership", "problem solving", "collaboration", "adaptability"],
}


def flatten_skills(categories: dict[str, list[str]]) -> list[str]:
    return [skill.lower() for group in categories.values() for skill in group]


def categorize_skills(found: Iterable[str]) -> dict[str, list[str]]:
    normalized = set(skill.lower() for skill in found)
    result: dict[str, list[str]] = {category: [] for category in SKILL_CATEGORIES}
    for category, candidates in SKILL_CATEGORIES.items():
        for skill in candidates:
            if skill.lower() in normalized:
                result[category].append(skill)
    return result
