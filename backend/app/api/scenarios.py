from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.seed_service import seed_database

router = APIRouter(prefix="/scenarios", tags=["Scenarios & Demo Setup"])

@router.post("/load-major-disaster")
def load_major_disaster_scenario(force_reset: bool = Query(True), db: Session = Depends(get_db)):
    """
    Seeds and activates the official 17-step presentation Major Disaster Scenario:
    - 4 simultaneous incidents (Highway Pileup, Building Fire, Flood, Industrial Explosion)
    - 49 patients under acute resource contention
    - 17 available ambulances, 14 ICU beds, 37 emergency beds
    - 3 blocked roads & traffic bottlenecks
    - Historical snapshots across the timeline (19:00, 19:15, 19:30, 19:45, 20:00)
    """
    res = seed_database(db=db, force_reset=force_reset, seed_demo_incidents=True)
    return {
        "status": "success",
        "scenario": "Major Disaster Contention Scenario",
        "summary": {
            "active_incidents": 4,
            "total_patients": 49,
            "available_ambulances": 17,
            "available_icu_beds": 14,
            "available_emergency_beds": 37,
            "blocked_roads": 3
        },
        "details": res
    }

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    return {
        "status": "operational",
        "system": "TERA Temporal Emergency Operations Grid",
        "city": "Tirupati Metropolitan Emergency Network (Simulated)",
        "db_connected": True
    }
