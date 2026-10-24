import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(role="admin"):
    p = "admin123" if role == "admin" else ("operator123" if role == "operator" else "analyst123")
    res = client.post("/api/auth/login", json={"username": role, "password": p})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "TERA"
    assert data["status"] == "ONLINE"

def test_auth_login():
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] in ["ADMIN", "ADMINISTRATOR"]

def test_dashboard_metrics():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "active_incidents" in data
    assert "available_ambulances" in data
    assert "available_icu_beds" in data
    assert data["active_incidents"] >= 1

def test_temporal_reconstruction():
    response = client.get("/api/temporal/reconstruct?timestamp=2026-09-12T19:30:00")
    assert response.status_code == 200
    data = response.json()
    assert "active_incidents_count" in data
    assert "available_icu_beds_count" in data
    assert "available_ambulances_count" in data
    assert len(data["incidents_snapshot"]) >= 1

def test_resource_allocation_solve():
    token = get_auth_token("operator")
    payload = {
        "latitude": 13.6350,
        "longitude": 79.4150,
        "severity": "CRITICAL",
        "patient_count": 8,
        "required_icu": 3,
        "required_emergency": 5
    }
    response = client.post(
        "/api/allocation/solve", 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_patients"] == 8
    assert len(data["assigned_hospitals"]) >= 1
    assert len(data["dispatched_ambulances"]) >= 1

def test_disaster_simulation():
    payload = {
        "scenario_name": "Test Hospital B Outage",
        "incident_type": "BUILDING_FIRE",
        "patient_count": 15,
        "severity": "CRITICAL",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "disabled_hospital_ids": ["HOSP_001"],
        "blocked_road_ids": ["ROAD_001"]
    }
    response = client.post("/api/simulation/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "impact_summary" in data

def test_database_performance_explain():
    response = client.get("/api/performance/explain?benchmark_type=temporal_lookup")
    assert response.status_code == 200
    data = response.json()
    assert "indexed_plan" in data
    assert "unindexed_plan" in data
    assert "speedup_factor" in data

def test_database_explorer():
    token = get_auth_token("analyst")
    response = client.get(
        "/api/explorer/table/hospital?limit=5",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["table_name"] == "hospital"
    assert len(data["rows"]) == 5
