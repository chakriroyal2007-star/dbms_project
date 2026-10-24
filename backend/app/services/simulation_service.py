import time
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import SimulationScenario, SimulationResult
from app.services.allocation_service import solve_emergency_allocation

def run_disaster_simulation(
    db: Session,
    scenario_name: str,
    incident_type: str,
    patient_count: int,
    severity: str,
    latitude: float,
    longitude: float,
    disabled_hospital_ids: List[str],
    blocked_road_ids: List[str]
) -> Dict[str, Any]:
    """
    Executes what-if simulation comparing baseline normal allocation vs disaster constrained allocation.
    Simulation results are isolated from live operational records.
    """
    start_time = time.time()
    
    # 1. Compute Baseline (All facilities & roads operational)
    baseline_plan = solve_emergency_allocation(
        db=db,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        patient_count=patient_count,
        disabled_hospital_ids=[],
        blocked_road_ids=[]
    )
    
    # 2. Compute Simulated Plan (With disabled hospitals & blocked corridors)
    simulated_plan = solve_emergency_allocation(
        db=db,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        patient_count=patient_count,
        disabled_hospital_ids=disabled_hospital_ids,
        blocked_road_ids=blocked_road_ids
    )
    
    exec_time_ms = round((time.time() - start_time) * 1000, 2)
    
    # Calculate Impact Summary
    baseline_avg_eta = (
        sum(h["eta_minutes"] for h in baseline_plan["assigned_hospitals"]) / len(baseline_plan["assigned_hospitals"])
        if baseline_plan["assigned_hospitals"] else 0.0
    )
    sim_avg_eta = (
        sum(h["eta_minutes"] for h in simulated_plan["assigned_hospitals"]) / len(simulated_plan["assigned_hospitals"])
        if simulated_plan["assigned_hospitals"] else 0.0
    )
    
    impact_summary = {
        "disabled_facilities_count": len(disabled_hospital_ids),
        "blocked_corridors_count": len(blocked_road_ids),
        "baseline_allocated_patients": baseline_plan["allocated_patients"],
        "simulated_allocated_patients": simulated_plan["allocated_patients"],
        "unallocated_patients_delta": simulated_plan["unallocated_patients"] - baseline_plan["unallocated_patients"],
        "eta_shift_minutes": round(sim_avg_eta - baseline_avg_eta, 1),
        "rerouted_facilities_count": len(simulated_plan["assigned_hospitals"])
    }
    
    # Persist simulation in dedicated simulation tables
    scenario_id = f"SCEN_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    scenario = SimulationScenario(
        scenario_id=scenario_id,
        name=scenario_name,
        description=f"What-if simulation for {patient_count} {severity} casualties with {len(disabled_hospital_ids)} disabled facilities.",
        incident_type=incident_type,
        patient_count=patient_count,
        severity=severity,
        disabled_hospital_ids=",".join(disabled_hospital_ids),
        blocked_road_ids=",".join(blocked_road_ids),
        created_at=datetime.datetime.utcnow()
    )
    db.add(scenario)
    
    sim_result = SimulationResult(
        result_id=f"RES_{scenario_id}",
        scenario_id=scenario_id,
        total_patients=patient_count,
        allocated_patients=simulated_plan["allocated_patients"],
        unallocated_patients=simulated_plan["unallocated_patients"],
        icu_allocated=sum(h["assigned_icu_beds"] for h in simulated_plan["assigned_hospitals"]),
        emergency_beds_allocated=sum(h["assigned_emergency_beds"] for h in simulated_plan["assigned_hospitals"]),
        average_eta_minutes=round(sim_avg_eta, 1),
        allocation_plan_json=simulated_plan,
        execution_time_ms=exec_time_ms,
        created_at=datetime.datetime.utcnow()
    )
    db.add(sim_result)
    db.commit()
    
    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario_name,
        "status": "completed",
        "baseline_plan": baseline_plan,
        "simulated_plan": simulated_plan,
        "impact_summary": impact_summary,
        "execution_time_ms": exec_time_ms
    }
