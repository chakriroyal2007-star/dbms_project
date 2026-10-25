import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _get_role_tokens():
    # 1. Administrator
    res_admin = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res_admin.status_code == 200
    admin_token = res_admin.json()["access_token"]

    # 2. Control Operator
    res_op = client.post("/api/auth/login", json={"username": "operator", "password": "operator123"})
    assert res_op.status_code == 200
    op_token = res_op.json()["access_token"]

    # 3. Analyst
    res_analyst = client.post("/api/auth/login", json={"username": "analyst", "password": "analyst123"})
    assert res_analyst.status_code == 200
    analyst_token = res_analyst.json()["access_token"]

    # 4. Reporter
    res_rep = client.post("/api/auth/login", json={"username": "reporter", "password": "reporter123"})
    assert res_rep.status_code == 200
    rep_token = res_rep.json()["access_token"]

    return admin_token, op_token, analyst_token, rep_token

def test_auth_login_all_four_roles():
    admin_token, op_token, analyst_token, rep_token = _get_role_tokens()
    assert admin_token and op_token and analyst_token and rep_token

def test_citizen_reporter_and_eoc_workflow():
    admin_token, op_token, analyst_token, rep_token = _get_role_tokens()

    # 1. Reporter submits emergency report
    report_payload = {
        "incident_type": "URBAN_FLASH_FLOOD",
        "description": "Rising waters near riverbridge corridor, 6 civilians trapped",
        "severity": "CRITICAL",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": "Sector 9 Underpass",
        "estimated_patient_count": 6,
        "reporter_name": "Local Citizen",
        "reporter_contact": "+91-9876543210"
    }
    res_report = client.post(
        "/api/incidents/report",
        json=report_payload,
        headers={"Authorization": f"Bearer {rep_token}"}
    )
    assert res_report.status_code == 200
    receipt = res_report.json()
    assert receipt["status"] == "RECEIVED"
    inc_id = receipt["incident_id"]
    assert "tracking_code" in receipt

    # 2. Control Operator accepts & verifies incident (Workflow Transition)
    res_verify = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=VERIFIED",
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert res_verify.status_code == 200
    assert res_verify.json()["current_status"] == "VERIFIED"

    # 3. Control Operator escalates to ACTIVE dispatch
    res_active = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=ACTIVE",
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert res_active.status_code == 200
    assert res_active.json()["current_status"] == "ACTIVE"

    # 4. Control Operator marks CONTAINED
    res_contained = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=CONTAINED",
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert res_contained.status_code == 200
    assert res_contained.json()["current_status"] == "CONTAINED"

def test_rbac_admin_only_endpoints():
    admin_token, op_token, analyst_token, rep_token = _get_role_tokens()

    # Analyst cannot create hospital
    hosp_payload = {
        "name": "Unauthorized Test Hospital",
        "hospital_type": "GOVERNMENT",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "emergency_level": "LEVEL_1",
        "contact_placeholder": "+91-877-0000000",
        "status": "ACTIVE",
        "icu_total": 10,
        "icu_available": 5,
        "emergency_beds_total": 20,
        "emergency_beds_available": 10,
        "general_beds_total": 50,
        "general_beds_available": 25
    }
    res_analyst_create = client.post(
        "/api/hospitals",
        json=hosp_payload,
        headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert res_analyst_create.status_code == 403

    # Reporter cannot create hospital
    res_rep_create = client.post(
        "/api/hospitals",
        json=hosp_payload,
        headers={"Authorization": f"Bearer {rep_token}"}
    )
    assert res_rep_create.status_code == 403

    # Admin CAN create hospital
    res_admin_create = client.post(
        "/api/hospitals",
        json=hosp_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin_create.status_code == 200
    created_hosp = res_admin_create.json()
    hosp_id = created_hosp["hospital_id"]

    # Operator cannot delete hospital (admin only)
    res_op_del = client.delete(
        f"/api/hospitals/{hosp_id}",
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert res_op_del.status_code == 403

    # Admin CAN delete hospital
    res_admin_del = client.delete(
        f"/api/hospitals/{hosp_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin_del.status_code == 200

def test_sql_playground_safety():
    admin_token, op_token, analyst_token, _ = _get_role_tokens()

    # SELECT query allowed for Admin & Analyst
    res_select = client.post(
        "/api/sql/execute",
        json={"sql_query": "SELECT hospital_id, name, emergency_level FROM hospital LIMIT 5;"},
        headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert res_select.status_code == 200
    data = res_select.json()
    assert "columns" in data
    assert "rows" in data
    assert len(data["columns"]) == 3
    assert data["row_count"] >= 1
    assert data["execution_time_ms"] >= 0

    # Malicious DROP query blocked
    res_drop = client.post(
        "/api/sql/execute",
        json={"sql_query": "DROP TABLE hospital;"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_drop.status_code == 403

    # Destructive DELETE query blocked
    res_delete = client.post(
        "/api/sql/execute",
        json={"sql_query": "DELETE FROM incident WHERE 1=1;"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_delete.status_code == 403

def test_audit_log_tracking():
    admin_token, _, _, _ = _get_role_tokens()

    # Trigger an audited event: e.g., create an incident
    inc_payload = {
        "incident_type": "AUDIT_TEST_FIRE",
        "description": "Triggering audit test event",
        "severity": "CRITICAL",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": "Audit Test Sector 4",
        "estimated_patient_count": 2
    }
    create_res = client.post(
        "/api/incidents",
        json=inc_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_res.status_code == 200
    inc_data = create_res.json()

    # Check audit logs endpoint
    res_logs = client.get(
        "/api/auth/audit-logs?limit=10",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_logs.status_code == 200
    logs = res_logs.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert any(l["entity_id"] == inc_data["incident_id"] or l["action"] in ["CREATE", "REPORT"] for l in logs)
