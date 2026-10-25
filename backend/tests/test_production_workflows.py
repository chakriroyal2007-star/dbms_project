import pytest
import io
import wave
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Incident, Patient
from app.api.evidence import extract_entities_from_transcript

client = TestClient(app)

def test_six_role_matrix_authentication():
    """Verify all 6 roles can authenticate with their credentials."""
    roles_credentials = [
        ("admin", "admin123", "ADMINISTRATOR"),
        ("operator", "operator123", "CONTROL_OPERATOR"),
        ("hospital_coord", "hospital123", "HOSPITAL_COORDINATOR"),
        ("responder", "responder123", "FIELD_RESPONDER"),
        ("analyst", "analyst123", "ANALYST"),
        ("reporter", "reporter123", "REPORTER")
    ]
    for username, pwd, expected_role in roles_credentials:
        res = client.post("/api/auth/login", json={"username": username, "password": pwd})
        assert res.status_code == 200, f"Failed login for {username}"
        data = res.json()
        assert data["role"] == expected_role
        assert "access_token" in data

def test_guest_emergency_reporting_and_durable_tracking():
    """
    Test Guest Citizen Emergency Reporting:
    1. Report emergency as guest (no JWT header).
    2. Verify tracking code and token are generated and persisted in DB.
    3. Verify NO fake patient clinical records are auto-generated.
    4. Verify public tracking endpoint /api/incidents/track/{code} works without authentication.
    """
    payload = {
        "incident_type": "ROAD_ACCIDENT",
        "description": "Multi-vehicle collision on bypass road with fluid leak.",
        "severity": "CRITICAL",
        "latitude": 13.6550,
        "longitude": 79.3950,
        "location_name": "Alipiri Bypass Circle, Tirupati",
        "estimated_patient_count": 4,
        "reporter_name": "Suresh Babu",
        "reporter_contact": "+91-9988776655",
        "reporter_consent": True,
        "location_accuracy_meters": 12.5,
        "is_location_verified": True
    }
    
    res = client.post("/api/incidents/report", json=payload)
    assert res.status_code == 200
    receipt = res.json()
    assert receipt["status"] == "RECEIVED"
    tracking_code = receipt["tracking_code"]
    inc_id = receipt["incident_id"]
    assert tracking_code.startswith("TRK-")
    assert receipt["estimated_patient_count"] == 4
    assert len(receipt["timeline_events"]) >= 1

    # Verify Database Persistence
    with SessionLocal() as db:
        db_inc = db.query(Incident).filter(Incident.incident_id == inc_id).first()
        assert db_inc is not None
        assert db_inc.tracking_code == tracking_code
        assert db_inc.reporter_name == "Suresh Babu"
        assert db_inc.reporter_phone == "+91-9988776655"
        
        # Verify NO fabricated patient records were auto-created
        pat_count = db.query(Patient).filter(Patient.incident_id == inc_id).count()
        assert pat_count == 0, "No placeholder patient records should be created on guest reports!"

    # Test Public Tracking without Token
    track_res = client.get(f"/api/incidents/track/{tracking_code}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["tracking_code"] == tracking_code
    assert track_data["incident_type"] == "ROAD_ACCIDENT"
    assert track_data["status"] == "RECEIVED"
    assert len(track_data["timeline"]) >= 1
    assert len(track_data["first_aid_guidance"]) >= 3

def test_operator_verification_and_timeline_propagation():
    """Test operator reviews and transitions incident status, generating real timeline milestones."""
    op_res = client.post("/api/auth/login", json={"username": "operator", "password": "operator123"})
    op_token = op_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {op_token}"}
    
    # 1. Create report
    res = client.post("/api/incidents/report", json={
        "incident_type": "COLLAPSE",
        "description": "Elderly person collapsed near temple gate.",
        "severity": "HIGH",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": "Temple North Entrance",
        "estimated_patient_count": 1
    })
    inc_id = res.json()["incident_id"]
    trk_code = res.json()["tracking_code"]
    
    # 2. Operator transitions to UNDER_REVIEW
    trans_res = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=UNDER_REVIEW&notes=Operator%20reviewing%20surveillance%20feed",
        headers=headers
    )
    assert trans_res.status_code == 200
    assert trans_res.json()["current_status"] == "UNDER_REVIEW"
    
    # 3. Operator transitions to VERIFIED
    verify_res = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=VERIFIED&notes=Confirmed%20by%20traffic%20camera",
        headers=headers
    )
    assert verify_res.status_code == 200
    
    # 4. Check Public Tracking shows all updated timeline milestones
    public_res = client.get(f"/api/incidents/track/{trk_code}")
    assert public_res.status_code == 200
    p_data = public_res.json()
    assert p_data["status"] == "VERIFIED"
    assert len(p_data["timeline"]) >= 3
    statuses = [e["status"] for e in p_data["timeline"]]
    assert "RECEIVED" in statuses
    assert "UNDER_REVIEW" in statuses
    assert "VERIFIED" in statuses

def test_state_machine_invalid_transition_rejected():
    """Verify state machine strictly rejects illegal status jumps (e.g. RECEIVED -> RESOLVED)."""
    op_res = client.post("/api/auth/login", json={"username": "operator", "password": "operator123"})
    op_token = op_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {op_token}"}

    res = client.post("/api/incidents/report", json={
        "incident_type": "STRUCTURAL_FIRE",
        "description": "Smoke in basement",
        "severity": "HIGH",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": "Downtown Arcade",
        "estimated_patient_count": 0
    })
    inc_id = res.json()["incident_id"]

    # Attempt illegal transition: RECEIVED directly to RESOLVED without verification/dispatch
    illegal_res = client.patch(
        f"/api/incidents/{inc_id}/status?new_status=RESOLVED",
        headers=headers
    )
    assert illegal_res.status_code == 400
    assert "Invalid status transition" in illegal_res.json()["detail"]

def test_evidence_upload_pipeline_and_authentic_stt():
    """
    Verify evidence upload pipeline:
    - Rejects files with invalid/dangerous extensions.
    - Accurately reports EMPTY_AUDIO on zero/tiny data without inventing canned transcripts.
    """
    # 1. Invalid extension rejected
    bad_files = {"file": ("malicious.exe", b"binarycontent", "application/octet-stream")}
    bad_res = client.post("/api/evidence/upload", files=bad_files)
    assert bad_res.status_code == 400

    # 2. Audio file upload: empty bytes returns EMPTY_AUDIO and NO canned text
    test_content = b"RIFF....WAVEfmt ....data...."
    files = {"file": ("dispatch_audio.wav", test_content, "audio/wav")}
    data = {"media_category": "AUDIO_VOICE"}
    
    upload_res = client.post("/api/evidence/upload", files=files, data=data)
    assert upload_res.status_code == 200
    u_json = upload_res.json()
    assert u_json["media_category"] == "AUDIO_VOICE"
    assert "speech_to_text" in u_json
    assert u_json["speech_to_text"]["status"] == "EMPTY_AUDIO"
    assert u_json["speech_to_text"]["transcript"] is None
    # Crucial rule: Never return canned collision text on empty audio
    assert "Severe traffic collision observed" not in str(u_json)
    assert "A high-speed collision occurred" not in str(u_json)

def test_structured_entity_extraction_truthfulness():
    """
    Verify structured extraction extracts only explicitly stated facts
    and marks unmentioned fields as Unknown rather than fabricating data.
    """
    # Case A: Transcript with stated casualties
    transcript_a = "Major car crash on highway near toll gate. Three people are injured and bleeding."
    extracted_a = extract_entities_from_transcript(transcript_a)
    assert extracted_a["incident_category"] == "ROAD_ACCIDENT"
    assert extracted_a["estimated_casualties"] == 3
    assert "Active bleeding observed" in extracted_a["reported_hazards"]

    # Case B: Transcript without mentioned casualties - must NOT invent numbers!
    transcript_b = "Heavy smoke coming from second floor apartment. Flames visible through window."
    extracted_b = extract_entities_from_transcript(transcript_b)
    assert extracted_b["incident_category"] == "STRUCTURAL_FIRE"
    assert extracted_b["estimated_casualties"] == "Unknown / Not specified"
    assert "Fire or smoke hazard" in extracted_b["reported_hazards"]

def test_responder_and_hospital_coordinator_endpoints():
    """Test Role 3 (Hospital Coordinator) and Role 4 (Field Responder) operations."""
    # Hospital Coordinator
    h_res = client.post("/api/auth/login", json={"username": "hospital_coord", "password": "hospital123"})
    h_token = h_res.json()["access_token"]
    h_headers = {"Authorization": f"Bearer {h_token}"}
    
    cap_update = client.post(
        "/api/coordination/hospital/capacity?icu_available=8&emergency_available=14&general_available=40",
        headers=h_headers
    )
    assert cap_update.status_code == 200
    assert cap_update.json()["status"] == "success"
    
    # Field Responder
    r_res = client.post("/api/auth/login", json={"username": "responder", "password": "responder123"})
    r_token = r_res.json()["access_token"]
    r_headers = {"Authorization": f"Bearer {r_token}"}
    
    resp_assign = client.get("/api/coordination/responder/assignments", headers=r_headers)
    assert resp_assign.status_code == 200
    assert isinstance(resp_assign.json(), list)

def test_guest_empty_my_reports_and_scoped_tracking():
    """
    Ensure:
    1. Guest with my_reports=True and no tracking codes gets an empty list [] (never all DB incidents!).
    2. Guest with my_reports=True and invalid tracking codes gets an empty list [].
    3. Guest with valid tracking codes only retrieves their specific reports.
    """
    # 1. Anonymous guest with no codes
    res_empty = client.get("/api/incidents?my_reports=true")
    assert res_empty.status_code == 200
    assert res_empty.json() == []

    # 2. Anonymous guest with invalid code
    res_fake = client.get("/api/incidents?my_reports=true&tracking_codes=TRK-FAKE-9999")
    assert res_fake.status_code == 200
    assert res_fake.json() == []

    # 3. Create a real incident and retrieve via tracking code
    payload = {
        "incident_type": "ROAD_ACCIDENT",
        "description": "Scooter skid near residential intersection.",
        "severity": "MEDIUM",
        "latitude": 13.6300,
        "longitude": 79.4200,
        "location_name": "Gandhi Road Cross 2",
        "estimated_patient_count": 1,
        "reporter_name": "Ravi Kumar",
        "reporter_contact": "+91-9123456789",
        "reporter_consent": True
    }
    create_res = client.post("/api/incidents/report", json=payload)
    assert create_res.status_code == 200
    trk_code = create_res.json()["tracking_code"]

    res_scoped = client.get(f"/api/incidents?my_reports=true&tracking_codes={trk_code}")
    assert res_scoped.status_code == 200
    data = res_scoped.json()
    assert len(data) == 1
    assert data[0]["tracking_code"] == trk_code
    assert data[0]["location_name"] == "Gandhi Road Cross 2"

def test_system_status_and_database_dialect_truthfulness():
    """Ensure root and health endpoints truthfully identify dialect and online status."""
    root_res = client.get("/")
    assert root_res.status_code == 200
    root_json = root_res.json()
    assert "database_dialect" in root_json
    assert root_json["database_connected"] is True
    assert root_json["database_dialect"] in ["sqlite", "postgresql"]

    health_res = client.get("/health")
    assert health_res.status_code == 200
    health_json = health_res.json()
    assert health_json["status"] == "HEALTHY"
    assert health_json["database_dialect"] in ["sqlite", "postgresql"]

