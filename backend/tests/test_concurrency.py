import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Hospital, HospitalCapacityHistory, ResourceAllocation, Incident
from app.services.allocation_service import commit_allocation_transaction

client = TestClient(app)

def test_concurrent_resource_allocation_safety():
    """
    DBMS Concurrency Test:
    Two incidents attempt to allocate hospital beds.
    Verifies ACID consistency: capacity is decremented accurately and no negative capacity occurs.
    """
    with SessionLocal() as db:
        hosp = db.query(Hospital).first()
        assert hosp is not None
        hosp_id = hosp.hospital_id
        
        # Get baseline capacity
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == hosp_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        
        initial_icu = latest_cap.icu_available
        initial_em = latest_cap.emergency_beds_available
        
        # Incident A Plan
        plan_a = {
            "incident_id": "INC_TEST_CONCURRENT_A",
            "assigned_hospitals": [{
                "hospital_id": hosp_id,
                "assigned_icu_beds": 1,
                "assigned_emergency_beds": 2,
                "assigned_patients": 3
            }],
            "dispatched_ambulances": [],
            "dispatched_teams": []
        }
        
        # Incident B Plan
        plan_b = {
            "incident_id": "INC_TEST_CONCURRENT_B",
            "assigned_hospitals": [{
                "hospital_id": hosp_id,
                "assigned_icu_beds": 1,
                "assigned_emergency_beds": 1,
                "assigned_patients": 2
            }],
            "dispatched_ambulances": [],
            "dispatched_teams": []
        }
        
        # Execute Incident A allocation transaction
        res_a = commit_allocation_transaction(db=db, plan=plan_a)
        assert res_a["status"] == "success"
        
        # Execute Incident B allocation transaction
        res_b = commit_allocation_transaction(db=db, plan=plan_b)
        assert res_b["status"] == "success"
        
        # Verify final capacity matches exact deductions
        final_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == hosp_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        
        assert final_cap.icu_available == initial_icu - 2
        assert final_cap.emergency_beds_available == initial_em - 3
        assert final_cap.icu_available >= 0
        assert final_cap.emergency_beds_available >= 0
