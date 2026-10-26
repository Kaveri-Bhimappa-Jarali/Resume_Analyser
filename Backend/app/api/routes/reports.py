from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app.api.dependencies import get_current_user
from app.core.exceptions import AppError
from app.db.database import get_db
from app.db.models import Analysis
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/{analysis_id}")
def get_report(analysis_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    analysis = (
        db.query(Analysis)
        .join(Analysis.resume)
        .filter(Analysis.id == analysis_id, Analysis.resume.has(user_id=current_user.id))
        .first()
    )
    if not analysis:
        raise AppError("Analysis report not found.", status_code=404)

    result = json.loads(analysis.result_json)
    return APIResponse(data=result, message="Report loaded successfully.")
