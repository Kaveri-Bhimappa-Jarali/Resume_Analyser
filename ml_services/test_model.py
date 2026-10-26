import requests

BASE = "http://127.0.0.1:8000"


def test_analyze():
    response = requests.post(
        f"{BASE}/analyze",
        json={
            "resume": "Python developer with FastAPI, scikit-learn, and pandas experience.",
            "job_description": "ML engineer role requiring Python and scikit-learn.",
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    assert "job_match_score" in data
    assert data["resume_analysis"]["detected_skills"]
    print("analyze ok:", data["job_match_score"])


def test_moderate():
    response = requests.post(
        f"{BASE}/moderate",
        json={"text": "how do I improve my resume for backend roles"},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    assert "spam_score" in data
    assert "toxic_score" in data
    print("moderate ok:", data)


if __name__ == "__main__":
    test_analyze()
    test_moderate()
    print("All ML tests passed.")
