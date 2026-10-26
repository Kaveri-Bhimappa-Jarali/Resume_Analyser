from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, resumes, analysis, jobs, reports
from app.core.config import settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import setup_logging
from app.db.database import init_db

setup_logging()
init_db()

app = FastAPI(title="AI Resume Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth, prefix="/api/auth", tags=["Authentication"])
app.include_router(resumes, prefix="/api/resumes", tags=["Resumes"])
app.include_router(analysis, prefix="/api/analysis", tags=["Analysis"])
app.include_router(jobs, prefix="/api/jobs", tags=["Jobs"])
app.include_router(reports, prefix="/api/reports", tags=["Reports"])

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

@app.get("/health")
def health_check():
    return {"success": True, "message": "AI Resume Analyzer backend is running."}
