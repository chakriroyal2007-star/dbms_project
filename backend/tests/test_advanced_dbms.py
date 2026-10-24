import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Hospital, HospitalCapacityHistory, Patient, Incident

client = TestClient(app)

def get_op_token():
    res = client.post("/api/auth/login", json={"username": "operator", "password": "operator123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_hospital_capacity_constraint_enforcement():
    """
    Edge Case: Hospital has limited ICU beds. Incident requires 3 ICU beds.
    TERA must strictly limit allocation within available beds for that hospital and spill over to next.
    """
    token = get_op_token()
    payload = {
        "latitude": 13.6350,
        "longitude": 79.4150,
        "severity": "CRITICAL",
        "patient_count": 3,
        "required_icu": 3,
        "required_emergency": 0
    }
    response = client.post(
        "/api/allocation/solve", 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Verify no individual hospital receives more ICU patients than its verified available ICU beds
    with SessionLocal() as db:
        for hosp_alloc in data["assigned_hospitals"]:
            h_id = hosp_alloc["hospital_id"]
            latest_cap = db.query(HospitalCapacityHistory).filter(
                HospitalCapacityHistory.hospital_id == h_id
            ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
            
            assert hosp_alloc["assigned_icu_beds"] <= latest_cap.icu_available, \
                f"Hospital {h_id} allocated {hosp_alloc['assigned_icu_beds']} ICU beds but only has {latest_cap.icu_available}!"

def test_temporal_differentiation():
    """
    Tests that historical intelligence returns distinct resource states for 19:00 vs 19:30.
    """
    res_1900 = client.get("/api/temporal/reconstruct?timestamp=2026-09-12T19:00:00").json()
    res_1930 = client.get("/api/temporal/reconstruct?timestamp=2026-09-12T19:30:00").json()
    
    # At 19:00, fewer incidents were reported and more ICU beds were available than at peak 19:30
    assert res_1900["available_icu_beds_count"] >= res_1930["available_icu_beds_count"]
    assert res_1930["active_incidents_count"] >= 1

def test_major_disaster_scenario_loading():
    """
    Tests that loading the official scenario resets and loads 4 simultaneous incidents with 49 patients.
    """
    response = client.post("/api/scenarios/load-major-disaster?force_reset=true")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["active_incidents"] == 4
    assert data["summary"]["total_patients"] == 49
    assert data["summary"]["available_ambulances"] == 17
    assert data["summary"]["blocked_roads"] == 3
