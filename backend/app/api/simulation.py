from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import SimulationRunRequest, SimulationRunResponse
from app.services.simulation_service import run_disaster_simulation

router = APIRouter(prefix="/simulation", tags=["Disaster Simulation"])

@router.post("/run", response_model=SimulationRunResponse)
def execute_simulation(request: SimulationRunRequest, db: Session = Depends(get_db)):
    """
    Simulates disaster what-if scenarios (disabling key hospitals or blocking roads)
    and computes dynamic resource rerouting without altering live production records.
    """
    res = run_disaster_simulation(
        db=db,
        scenario_name=request.scenario_name,
        incident_type=request.incident_type,
        patient_count=request.patient_count,
        severity=request.severity,
        latitude=request.latitude,
        longitude=request.longitude,
        disabled_hospital_ids=request.disabled_hospital_ids,
        blocked_road_ids=request.blocked_road_ids
    )
    return res
