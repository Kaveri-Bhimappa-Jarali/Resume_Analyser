import os
import re
import json
import requests
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# --------------------------------------------------
# Environment
# --------------------------------------------------

def load_env_file(filepath: str):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (
                            val.startswith("'") and val.endswith("'")
                        ):
                            val = val[1:-1]
                        os.environ[key] = val


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_env_file(os.path.join(BASE_DIR, "..", "Backend", ".env"))
load_env_file(os.path.join(BASE_DIR, ".env"))

app = FastAPI(
    title="Resume Analysis ML API",
    description="TF-IDF resume analysis and message moderation using scikit-learn.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Skill & job role knowledge base
# --------------------------------------------------

SKILLS = [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby",
    "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "nosql", "mongodb",
    "postgresql", "mysql", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask",
    "fastapi", "spring", "graphql", "rest", "api", "microservices", "git", "ci/cd",
    "jenkins", "terraform", "linux", "agile", "scrum", "machine learning",
    "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "data analysis", "data science", "nlp", "computer vision", "html", "css",
    "tailwind", "sass", "figma", "ui/ux", "testing", "jest", "cypress", "selenium",
    "cybersecurity", "blockchain", "solidity", "devops", "cloud", "firebase",
    "supabase", "prisma", "typescript", "webpack", "vite", "redux", "socket.io",
    "communication", "leadership", "problem solving", "teamwork", "project management",
]

JOB_ROLES = {
    "Full Stack Developer": [
        "javascript", "react", "node.js", "express", "mongodb", "sql", "git", "rest", "api",
    ],
    "Frontend Developer": [
        "javascript", "react", "html", "css", "typescript", "tailwind", "git", "ui/ux",
    ],
    "Backend Developer": [
        "python", "node.js", "express", "django", "postgresql", "mongodb", "rest", "api", "docker",
    ],
    "Data Scientist": [
        "python", "machine learning", "pandas", "numpy", "scikit-learn", "sql", "data analysis", "tensorflow",
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "aws", "ci/cd", "linux", "terraform", "jenkins", "git", "cloud",
    ],
    "Mobile Developer": [
        "react", "javascript", "swift", "kotlin", "git", "rest", "api", "ui/ux",
    ],
    "ML Engineer": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    ],
}

CAREER_PATHS = {
    "Full Stack Developer": ["Senior Full Stack Developer", "Tech Lead", "Engineering Manager"],
    "Frontend Developer": ["Senior Frontend Developer", "UI Engineer", "Frontend Architect"],
    "Backend Developer": ["Senior Backend Developer", "Platform Engineer", "Backend Architect"],
    "Data Scientist": ["Senior Data Scientist", "ML Engineer", "AI Research Scientist"],
    "DevOps Engineer": ["Senior DevOps Engineer", "Site Reliability Engineer", "Cloud Architect"],
    "Mobile Developer": ["Senior Mobile Developer", "Mobile Tech Lead", "Product Engineer"],
    "ML Engineer": ["Senior ML Engineer", "AI Architect", "Research Engineer"],
}

# --------------------------------------------------
# Moderation training data
# --------------------------------------------------

SPAM_SAMPLES = [
    "buy now click here limited offer",
    "make money fast work from home",
    "free crypto investment guaranteed returns",
    "subscribe to my channel for giveaways",
    "dm me for cheap followers and likes",
    "promo code discount sale today only",
    "join my telegram group for signals",
    "earn $5000 per week no experience",
    "click this link to claim your prize",
    "advertisement sponsored post buy followers",
]

HAM_SAMPLES = [
    "how do i improve my resume for backend roles",
    "what skills should i learn for react interviews",
    "can someone review my project portfolio",
    "thanks for the interview preparation tips",
    "i am preparing for a data science role",
    "does anyone have experience with fastapi",
    "looking for advice on system design interviews",
    "what is the best way to learn docker",
    "sharing my experience with mock interviews",
    "great community discussion about career growth",
]

TOXIC_SAMPLES = [
    "you are an idiot and worthless",
    "shut up nobody cares about you",
    "i hate you go away loser",
    "you are stupid and should quit",
    "kill yourself nobody likes you",
    "you are trash at coding",
    "get lost you dumb person",
    "worst advice ever you suck",
    "you deserve to fail completely",
    "shut your mouth you fool",
]

SAFE_SAMPLES = [
    "thanks for sharing this helpful resource",
    "i disagree but appreciate your perspective",
    "could you explain that concept again",
    "that is a good point about system design",
    "i found this interview question challenging",
    "let us discuss best practices for apis",
    "your resume feedback was very useful",
    "i am learning react and node this month",
    "what projects would you recommend for beginners",
    "happy to help with mock interview practice",
]

spam_classifier: Optional[Pipeline] = None
toxic_classifier: Optional[Pipeline] = None


def build_classifier(samples_pos: List[str], samples_neg: List[str], model):
    texts = samples_pos + samples_neg
    labels = [1] * len(samples_pos) + [0] * len(samples_neg)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", model),
    ])
    pipeline.fit(texts, labels)
    return pipeline


def init_models():
    global spam_classifier, toxic_classifier
    spam_classifier = build_classifier(SPAM_SAMPLES, HAM_SAMPLES, MultinomialNB())
    toxic_classifier = build_classifier(TOXIC_SAMPLES, SAFE_SAMPLES, LogisticRegression(max_iter=1000))


init_models()

# --------------------------------------------------
# Request models
# --------------------------------------------------

class ResumeRequest(BaseModel):
    resume: str
    job_description: str


class Message(BaseModel):
    text: str

# --------------------------------------------------
# Helpers
# --------------------------------------------------

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_skills(text: str) -> List[str]:
    normalized = normalize_text(text)
    found = []
    for skill in SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, normalized):
            found.append(skill.title() if skill.islower() else skill)
    return sorted(set(found), key=str.lower)


def compute_match_score(resume: str, job_description: str) -> float:
    if not job_description.strip():
        skills = extract_skills(resume)
        return round(min(40 + len(skills) * 3, 95), 2)

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([resume, job_description])
    score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return round(max(0.0, min(score * 100, 100.0)), 2)


def build_job_recommendations(resume: str, job_description: str) -> List[dict]:
    resume_skills = set(s.lower() for s in extract_skills(resume))
    jd_skills = set(s.lower() for s in extract_skills(job_description)) if job_description.strip() else set()
    target_skills = resume_skills | jd_skills

    recommendations = []

    for role, required in JOB_ROLES.items():
        required_set = set(s.lower() for s in required)
        matching = sorted(required_set & target_skills)
        missing = sorted(required_set - target_skills)
        match_score = round((len(matching) / max(len(required_set), 1)) * 100, 2)

        recommendations.append({
            "job_title": role,
            "role": role,
            "match_score": match_score,
            "matching_skills": [s.title() for s in matching],
            "missing_skills": [s.title() for s in missing],
        })

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations[:5]


def build_career_paths(recommendations: List[dict]) -> List[str]:
    if not recommendations:
        return ["Software Developer", "Technical Specialist", "Team Lead"]

    top_role = recommendations[0].get("role", "Full Stack Developer")
    return CAREER_PATHS.get(top_role, ["Senior Engineer", "Tech Lead", "Architect"])


def fetch_real_jobs(role: str) -> List[dict]:
    app_id = os.getenv("ADZUNA_APP_ID", "ca7c8266")
    app_key = os.getenv("ADZUNA_APP_KEY", "d614f22e0aa5215b73470d6763899691")
    url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": role,
        "results_per_page": 5,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return []

        jobs = []
        for job in response.json().get("results", []):
            jobs.append({
                "title": job.get("title"),
                "company": job.get("company", {}).get("display_name"),
                "location": job.get("location", {}).get("display_name"),
                "apply_link": job.get("redirect_url"),
            })
        return jobs
    except Exception as exc:
        print(f"Adzuna fetch error: {exc}")
        return []

# --------------------------------------------------
# Endpoints
# --------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "Resume Analysis ML API is running",
        "engine": "scikit-learn",
        "endpoints": ["/analyze", "/moderate"],
    }


@app.post("/analyze")
def analyze(data: ResumeRequest):
    resume = data.resume.strip()
    job_description = data.job_description.strip()

    if not resume:
        raise HTTPException(status_code=400, detail="Resume text is required.")

    try:
        detected_skills = extract_skills(resume)
        job_match_score = compute_match_score(resume, job_description)
        job_recommendations = build_job_recommendations(resume, job_description)
        career_paths = build_career_paths(job_recommendations)

        live_jobs = []
        if job_recommendations:
            live_jobs = fetch_real_jobs(job_recommendations[0].get("job_title", "Software Developer"))

        return {
            "job_match_score": job_match_score,
            "resume_analysis": {
                "detected_skills": detected_skills,
            },
            "job_recommendations": job_recommendations,
            "career_paths": career_paths,
            "live_jobs": live_jobs,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/moderate")
def moderate_message(message: Message):
    text = message.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        spam_prob = float(spam_classifier.predict_proba([text])[0][1])
        toxic_prob = float(toxic_classifier.predict_proba([text])[0][1])

        return {
            "toxic_score": round(toxic_prob, 4),
            "spam_score": round(spam_prob, 4),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
