from app.services.analyzer import Analyzer


def test_ats_score_and_overall_score():
    resume_text = "Professional Experience in Python, FastAPI, AWS. Education and Projects sections present."
    analyzer = Analyzer(resume_text)
    assert analyzer.score_ats() >= 0
    assert analyzer.score_overall() >= 0


def test_job_match_score():
    resume_text = "Experienced Python developer with FastAPI and AWS skills."
    job_text = "We are looking for a Python engineer with FastAPI and AWS experience."
    analyzer = Analyzer(resume_text, job_text)
    job_match = analyzer.job_match()
    assert job_match["score"] is not None
    assert "python" in [s.lower() for s in job_match["matched"]]
