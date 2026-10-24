import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.temporal_service import reconstruct_temporal_state
from app.schemas.schemas import TemporalStateResponse

router = APIRouter(prefix="/temporal", tags=["Historical Intelligence"])

@router.get("/reconstruct", response_model=TemporalStateResponse)
def get_temporal_state(
    timestamp: str = Query(..., description="Target ISO timestamp or YYYY-MM-DDTHH:MM:SS (e.g. 2026-09-12T19:30:00)"),
    db: Session = Depends(get_db)
):
    """
    Reconstructs the exact relational database emergency state valid at target timestamp T.
    Evaluates:
    - Active incidents valid at T
    - Ambulance locations & availability at T
    - Hospital ICU / Emergency beds available at T
    - Road blockage & traffic conditions at T
    """
    try:
        # Parse timestamp safely
        if "Z" in timestamp:
            clean_ts = timestamp.replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(clean_ts)
        elif "+" in timestamp:
            dt = datetime.datetime.fromisoformat(timestamp)
        else:
            dt = datetime.datetime.fromisoformat(timestamp)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
    except Exception:
        dt = datetime.datetime(2026, 9, 12, 19, 30, 0, tzinfo=datetime.timezone.utc)

    state = reconstruct_temporal_state(db=db, target_timestamp=dt)
    return state
