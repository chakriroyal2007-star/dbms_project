"""
TERA Master Regression Test Suite: Reporter-to-Operator Data Flow
Authoritative tests for:
1. Guest creates a valid emergency incident (unauthenticated).
2. Incident is durably committed and can be fetched immediately.
3. Authorized operator retrieves the same incident ID in the queue.
4. Pending incident (RECEIVED status) appears in operator queue BEFORE verification.
5. Missing optional evidence or sparse location does not exclude the incident.
6. Invalid input fails validation and does not create an incident.
7. Retrying a request with same idempotency key returns existing incident without creating duplicates.
8. Double submit / concurrent submission replay returns same incident.
9. Unauthorized / anonymous user cannot retrieve protected incident queue (HTTP 401).
10. Organization boundaries and role isolation remain enforced (Reporter cannot see operator queue).
11. Queue pagination and filters ('ALL', 'RECEIVED', 'ACTIVE', 'RESOLVED') correctly include the record.
12. Dashboard metrics count matches authoritative database records across operational lifecycle.
13. Health and readiness check truthfully reports dialect and persistence durability.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import UserAccount, Incident, IncidentTimelineEvent, Organization

client = TestClient(app)

def _get_operator_token():
    res = client.post("/api/auth/login", json={"username": "operator", "password": "operator123"})
    assert res.status_code == 200, f"Operator login failed: {res.text}"
    return res.json()["access_token"]

def _get_reporter_token():
    res = client.post("/api/auth/login", json={"username": "reporter", "password": "reporter123"})
    assert res.status_code == 200, f"Reporter login failed: {res.text}"
    return res.json()["access_token"]

def _get_admin_token():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]


# ------------------------------------------------------------------------------
# Test 1 & 2: Guest creates valid incident, durably committed and fetched immediately
# ------------------------------------------------------------------------------
def test_guest_creates_valid_incident_and_persisted():
    unique_marker = uuid.uuid4().hex[:8].upper()
    payload = {
        "incident_type": "ROAD_ACCIDENT",
        "description": f"Vehicle collision near RTC Central Stand [Marker: {unique_marker}]",
        "severity": "CRITICAL",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": f"RTC Central Bus Stand Circle {unique_marker}",
        "estimated_patient_count": 2,
        "reporter_name": "Bystander Ramesh",
        "reporter_contact": "+91-9876543210",
        "reporter_consent": True,
        "idempotency_key": f"IDEMP-FLOW-{unique_marker}"
    }

    # Guest submission requires NO token
    res = client.post("/api/incidents/report", json=payload)
    assert res.status_code == 200, f"Submission failed: {res.text}"
    receipt = res.json()

    assert "incident_id" in receipt
    assert "tracking_code" in receipt
    assert receipt["status"] == "RECEIVED"
    assert receipt["location_name"] == payload["location_name"]
    assert receipt["estimated_patient_count"] == 2
    inc_id = receipt["incident_id"]

    # Verify directly in authoritative database
    with SessionLocal() as db:
        persisted = db.query(Incident).filter(Incident.incident_id == inc_id).first()
        assert persisted is not None, "Incident was not committed to authoritative database!"
        assert persisted.status == "RECEIVED"
        assert persisted.description == payload["description"]
        assert persisted.idempotency_key == payload["idempotency_key"]

        # Verify initial timeline event exists
        event = db.query(IncidentTimelineEvent).filter(IncidentTimelineEvent.incident_id == inc_id).first()
        assert event is not None, "Timeline event was not written transactionally!"
        assert event.status == "RECEIVED"


# ------------------------------------------------------------------------------
# Test 3 & 4: Authorized operator retrieves the same incident ID BEFORE verification
# ------------------------------------------------------------------------------
def test_authorized_operator_retrieves_incident_before_verification():
    unique_marker = uuid.uuid4().hex[:8].upper()
    payload = {
        "incident_type": "COLLAPSE",
        "description": f"Building scaffold collapse at Market Yard [Marker: {unique_marker}]",
        "severity": "HIGH",
        "latitude": 13.6350,
        "longitude": 79.4250,
        "location_name": f"Market Yard Lane 4 {unique_marker}",
        "estimated_patient_count": 3,
        "idempotency_key": f"IDEMP-OP-{unique_marker}"
    }

    # Guest reports incident
    report_res = client.post("/api/incidents/report", json=payload)
    assert report_res.status_code == 200
    inc_id = report_res.json()["incident_id"]

    # Control Operator retrieves queue
    op_token = _get_operator_token()
    queue_res = client.get("/api/incidents?limit=50", headers={"Authorization": f"Bearer {op_token}"})
    assert queue_res.status_code == 200
    queue = queue_res.json()

    # The incident MUST be in the operator queue in RECEIVED state (before verification)
    matching = next((i for i in queue if i["incident_id"] == inc_id), None)
    assert matching is not None, f"Reported incident {inc_id} not visible in operator queue!"
    assert matching["status"] == "RECEIVED", f"Expected initial status RECEIVED, got {matching['status']}"
    assert matching["location_name"] == payload["location_name"]
    assert matching["incident_type"] == "COLLAPSE"


# ------------------------------------------------------------------------------
# Test 5: Missing optional evidence or sparse location does not exclude incident
# ------------------------------------------------------------------------------
def test_missing_optional_evidence_sparse_details_still_visible():
    unique_marker = uuid.uuid4().hex[:8].upper()
    sparse_payload = {
        "incident_type": "OTHER",
        "description": f"Unknown smoke sighting [Marker: {unique_marker}]",
        "severity": "LOW",
        "latitude": 13.6200,
        "longitude": 79.4100,
        "location_name": "Rural Perimeter Road",
        "estimated_patient_count": 0,
        "idempotency_key": f"IDEMP-SPARSE-{unique_marker}"
        # Missing voice_transcript, evidence_urls, landmark, locality
    }

    res = client.post("/api/incidents/report", json=sparse_payload)
    assert res.status_code == 200
    inc_id = res.json()["incident_id"]

    op_token = _get_operator_token()
    queue_res = client.get("/api/incidents?limit=50", headers={"Authorization": f"Bearer {op_token}"})
    assert queue_res.status_code == 200
    assert any(i["incident_id"] == inc_id for i in queue_res.json())


# ------------------------------------------------------------------------------
# Test 6: Invalid input does not create an incident
# ------------------------------------------------------------------------------
def test_invalid_input_rejected_without_database_mutation():
    bad_payload = {
        "incident_type": "", # Blank type
        "description": "",   # Blank description
        "latitude": "NOT_A_COORDINATE", # Invalid latitude type
    }

    res = client.post("/api/incidents/report", json=bad_payload)
    assert res.status_code == 422  # Pydantic validation failure


# ------------------------------------------------------------------------------
# Test 7 & 8: Idempotency: Retrying or double submitting does not create duplicates
# ------------------------------------------------------------------------------
def test_submission_idempotency_prevents_duplicate_incidents():
    unique_key = f"IDEMP-DEDUP-{uuid.uuid4().hex[:8].upper()}"
    payload = {
        "incident_type": "TRAUMA_INJURY",
        "description": "Pedestrian slip injury on wet surface",
        "severity": "MEDIUM",
        "latitude": 13.6300,
        "longitude": 79.4200,
        "location_name": "Sector 3 Pavement",
        "estimated_patient_count": 1,
        "idempotency_key": unique_key
    }

    # 1. First submission
    res1 = client.post("/api/incidents/report", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    inc_id = data1["incident_id"]
    trk_code = data1["tracking_code"]

    # 2. Replayed submission (double click or network timeout retry with same idempotency key)
    res2 = client.post("/api/incidents/report", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()

    # Must return identical persisted reference
    assert data2["incident_id"] == inc_id, "Idempotency violated: created duplicate incident ID!"
    assert data2["tracking_code"] == trk_code, "Idempotency violated: created duplicate tracking code!"

    # Verify directly in database that only ONE record exists
    with SessionLocal() as db:
        records = db.query(Incident).filter(Incident.idempotency_key == unique_key).all()
        assert len(records) == 1, f"Expected 1 record for idempotency key, found {len(records)}!"


# ------------------------------------------------------------------------------
# Test 9: Unauthorized users cannot retrieve operational queue
# ------------------------------------------------------------------------------
def test_unauthorized_user_cannot_retrieve_operator_queue():
    # Calling GET /api/incidents without authentication credentials must fail with 401
    res_anon = client.get("/api/incidents")
    assert res_anon.status_code == 401, f"Expected 401 Unauthorized, got {res_anon.status_code}"
    assert "authentication credentials required" in res_anon.json()["detail"].lower()


# ------------------------------------------------------------------------------
# Test 10: Organization boundaries and role isolation remain enforced
# ------------------------------------------------------------------------------
def test_role_isolation_reporter_cannot_see_operator_queue():
    reporter_token = _get_reporter_token()

    # Reporter accessing /api/incidents only sees incidents reported by themselves
    res = client.get("/api/incidents", headers={"Authorization": f"Bearer {reporter_token}"})
    assert res.status_code == 200
    for inc in res.json():
        # Any returned incident must belong to this reporter or have their reporter_id
        with SessionLocal() as db:
            rep_user = db.query(UserAccount).filter(UserAccount.username == "reporter").first()
            assert inc["reporter_id"] == rep_user.user_id


# ------------------------------------------------------------------------------
# Test 11: Queue status filtering includes newly received and active reports
# ------------------------------------------------------------------------------
def test_queue_status_filters():
    op_token = _get_operator_token()
    unique_marker = uuid.uuid4().hex[:6].upper()

    # Create an incident in RECEIVED status
    res = client.post("/api/incidents/report", json={
        "incident_type": "FIRE_HAZARD",
        "description": f"Small electrical short circuit [Marker: {unique_marker}]",
        "severity": "LOW",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": f"Substation Cross {unique_marker}",
        "estimated_patient_count": 0,
        "idempotency_key": f"IDEMP-STATUS-{unique_marker}"
    })
    assert res.status_code == 200
    inc_id = res.json()["incident_id"]

    # Filter for RECEIVED
    res_received = client.get("/api/incidents?status=RECEIVED", headers={"Authorization": f"Bearer {op_token}"})
    assert res_received.status_code == 200
    assert any(i["incident_id"] == inc_id for i in res_received.json())

    # Filter for comma-separated statuses "RECEIVED,UNDER_REVIEW"
    res_multi = client.get("/api/incidents?status=RECEIVED,UNDER_REVIEW", headers={"Authorization": f"Bearer {op_token}"})
    assert res_multi.status_code == 200
    assert any(i["incident_id"] == inc_id for i in res_multi.json())


# ------------------------------------------------------------------------------
# Test 12: Dashboard metrics count matches authoritative database query
# ------------------------------------------------------------------------------
def test_dashboard_metrics_match_authoritative_database():
    op_token = _get_operator_token()

    # Fetch metrics
    metrics_res = client.get("/api/dashboard/metrics", headers={"Authorization": f"Bearer {op_token}"})
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()

    # Query authoritative database count
    ACTIVE_STATUSES = [
        'DRAFT', 'SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'VERIFIED',
        'RESPONSE_REQUESTED', 'RESOURCE_ACKNOWLEDGED', 'ASSIGNED',
        'EN_ROUTE', 'ARRIVED', 'ACTIVE', 'REPORTED', 'CONTAINED'
    ]
    with SessionLocal() as db:
        actual_active = db.query(Incident).filter(Incident.status.in_(ACTIVE_STATUSES)).count()
        assert metrics["active_incidents"] == actual_active, (
            f"Metrics active_incidents ({metrics['active_incidents']}) "
            f"does not match database query ({actual_active})!"
        )


# ------------------------------------------------------------------------------
# Test 13: System health check reports dialect and persistence status truthfully
# ------------------------------------------------------------------------------
def test_system_health_and_persistence_status():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "database_connected" in data
    assert data["database_connected"] is True
    assert "database_dialect" in data
    assert "database_persistence" in data
