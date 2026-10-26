import io
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_voice_health():
    """Verify voice health endpoint returns provider configuration and limits."""
    res = client.get("/api/voice/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE"
    assert "supported_audio_formats" in data
    assert data["max_upload_size_mb"] > 0

    # Test /api/v1 alias as well
    res_v1 = client.get("/api/v1/voice/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "ONLINE"

def test_transcription_empty_audio_rejection():
    """Verify empty audio uploads are rejected with 400 Bad Request."""
    empty_file = io.BytesIO(b"")
    res = client.post(
        "/api/voice/transcriptions",
        files={"audio": ("empty.wav", empty_file, "audio/wav")}
    )
    assert res.status_code == 400
    assert "empty or corrupt" in res.json()["detail"].lower()

def test_transcription_unsupported_format_rejection():
    """Verify unsupported file formats are rejected with 400 Bad Request."""
    fake_exe = io.BytesIO(b"MZ\x90\x00" * 50)
    res = client.post(
        "/api/voice/transcriptions",
        files={"audio": ("malicious.exe", fake_exe, "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "unsupported audio format" in res.json()["detail"].lower()

def test_transcription_oversized_audio_rejection():
    """Verify uploads exceeding MAX_UPLOAD_SIZE_MB are rejected with 413."""
    with patch("app.config.settings.MAX_UPLOAD_SIZE_MB", 0.001):  # ~1KB limit
        large_file = io.BytesIO(b"x" * 2048)
        res = client.post(
            "/api/voice/transcriptions",
            files={"audio": ("oversized.wav", large_file, "audio/wav")}
        )
        assert res.status_code == 413
        assert "exceeds maximum limit" in res.json()["detail"].lower()

def test_structured_entity_extraction_road_accident():
    """Verify deterministic extraction without hallucinations."""
    payload = {
        "transcript": "There is a major car crash with two people injured near Gandhi Road cross junction. Active bleeding observed, need an ambulance quickly.",
        "user_corrected": None
    }
    res = client.post("/api/voice/extract-entities", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_category"] == "ROAD_ACCIDENT"
    assert data["affected_people_count"] == "2"
    assert "near Gandhi Road cross junction" in data["summary"]
    assert any("bleeding" in inj.lower() for inj in data["reported_injuries"])
    assert any("ambulance" in a.lower() for a in data["assistance_requested"])
    assert data["provenance"] == "MACHINE_GENERATED"
    assert data["verification_status"] == "UNVERIFIED_PENDING_REVIEW"

def test_structured_entity_extraction_fire_hazards():
    """Verify fire hazards and structural collapse cues."""
    payload = {
        "transcript": "Huge structural fire and smoke at the factory, four people trapped inside, fuel leak suspected.",
        "user_corrected": None
    }
    res = client.post("/api/voice/extract-entities", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_category"] == "STRUCTURAL_FIRE"
    assert data["affected_people_count"] == "4"
    assert any("fire" in h.lower() for h in data["reported_hazards"])
    assert any("fuel leak" in h.lower() for h in data["reported_hazards"])
    assert any("trapped" in h.lower() for h in data["reported_hazards"])

def test_user_correction_pipeline():
    """Verify user-corrected transcripts preserve both raw and corrected versions."""
    payload = {
        "original_transcript": "two cars crash near garden road",
        "user_corrected_transcript": "two cars crash near Gandhi Road cross junction with one passenger unconscious"
    }
    res = client.post("/api/voice/correct-transcript", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["original_transcript"] == payload["original_transcript"]
    assert data["user_corrected_transcript"] == payload["user_corrected_transcript"]
    assert data["provenance"] == "USER_CORRECTED"
    assert data["extracted_entities"]["affected_people_count"] == "1"
    assert any("unconscious" in inj.lower() for inj in data["extracted_entities"]["reported_injuries"])

def test_provider_outage_handling():
    """Verify provider unreachable returns structured error with correlation ID and retryable status (never fake canned text)."""
    with patch("app.api.voice.transcribe_audio_payload") as mock_stt:
        mock_stt.return_value = {
            "status": "PROVIDER_UNAVAILABLE",
            "correlation_id": "stt_test_12345",
            "provider": "GOOGLE_SPEECH",
            "error": "Speech recognition service temporarily unreachable",
            "retryable": True
        }
        
        sample_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00" + b"\x00" * 300)
        res = client.post(
            "/api/voice/transcriptions",
            files={"audio": ("test.wav", sample_audio, "audio/wav")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert data["status"] == "PROVIDER_UNAVAILABLE"
        assert data["correlation_id"] == "stt_test_12345"
        assert data["retryable"] is True
        assert data["transcript"] is None  # Never canned text

def test_reverse_geocoding_validation():
    """Verify coordinate bounds validation on reverse geocoding endpoint."""
    # Invalid lat > 90
    res_bad_lat = client.get("/api/geocoding/reverse?lat=95.0&lng=79.4")
    assert res_bad_lat.status_code == 422

    # Invalid lng < -180
    res_bad_lng = client.get("/api/geocoding/reverse?lat=13.6&lng=-185.0")
    assert res_bad_lng.status_code == 422

    # Valid query executes safely without throwing unhandled exceptions
    res_valid = client.get("/api/geocoding/reverse?lat=13.6288&lng=79.4192")
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["latitude"] == 13.6288
    assert data["longitude"] == 79.4192
    assert "status" in data

def test_successful_audio_transcription_and_structured_persistence():
    """Verify end-to-end voice upload, extraction, submission, persistence, and tracking."""
    sample_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00" + b"\x00" * 400)
    
    mock_extracted = {
        "original_transcript": "Road collision on Alipiri bypass road, two people bleeding, send ambulance now",
        "confirmed_transcript": None,
        "incident_summary": "Caller reported road accident near Alipiri bypass road with 2 person(s) affected.",
        "incident_type": "ROAD_ACCIDENT",
        "reported_location": "Alipiri bypass road",
        "people_affected": "2",
        "reported_injuries": ["Active bleeding"],
        "reported_hazards": ["Active highway traffic hazard"],
        "assistance_requested": ["Medical Ambulance (ALS/BLS)"],
        "unknown_fields": [],
        "extraction_status": "SUCCESS",
        "confirmation_status": "UNCONFIRMED_PENDING_REVIEW"
    }

    with patch("app.api.voice.transcribe_audio_payload") as mock_stt:
        mock_stt.return_value = {
            "status": "SUCCESS",
            "correlation_id": "stt_reg_success_1",
            "transcript": "Road collision on Alipiri bypass road, two people bleeding, send ambulance now",
            "confidence": 0.94,
            "detected_language": "en",
            "extracted_entities": mock_extracted,
            "provider": "GOOGLE_SPEECH"
        }

        # 1. Transcribe audio
        res = client.post(
            "/api/voice/transcriptions",
            files={"audio": ("voice_report.wav", sample_wav, "audio/wav")}
        )
        assert res.status_code == 200
        trans_data = res.json()
        assert trans_data["success"] is True
        assert trans_data["status"] == "SUCCESS"
        assert trans_data["transcript"] == mock_extracted["original_transcript"]
        assert trans_data["extracted_entities"]["incident_type"] == "ROAD_ACCIDENT"

        # 2. Reporter confirms and submits report
        report_payload = {
            "incident_type": "ROAD_ACCIDENT",
            "description": trans_data["transcript"],
            "severity": "CRITICAL",
            "latitude": 13.6288,
            "longitude": 79.4192,
            "location_name": "Alipiri Bypass Road, Tirupati",
            "estimated_patient_count": 2,
            "reporter_name": "Eyewitness Caller",
            "voice_transcript": trans_data["transcript"],
            "structured_extraction": {
                **trans_data["extracted_entities"],
                "confirmed_transcript": trans_data["transcript"],
                "confirmation_status": "CONFIRMED_BY_USER"
            }
        }
        rep_res = client.post("/api/incidents/report", json=report_payload)
        assert rep_res.status_code == 200
        receipt = rep_res.json()
        tracking_code = receipt["tracking_code"]
        assert tracking_code.startswith("TRK-")
        assert receipt["voice_transcript"] == trans_data["transcript"]
        assert receipt["structured_extraction"]["confirmation_status"] == "CONFIRMED_BY_USER"

        # 3. Verify bystander tracking reads persisted structured extraction
        track_res = client.get(f"/api/incidents/track/{tracking_code}")
        assert track_res.status_code == 200
        track_data = track_res.json()
        assert track_data["tracking_code"] == tracking_code
        assert track_data["voice_transcript"] == trans_data["transcript"]
        assert track_data["structured_extraction_json"]["people_affected"] == "2"
        assert track_data["structured_extraction_json"]["incident_type"] == "ROAD_ACCIDENT"

def test_unknown_fields_remain_unknown():
    """Verify extraction does not fabricate missing facts; unknown details remain explicit."""
    payload = {
        "transcript": "I see smoke coming from somewhere behind the trees.",
        "user_corrected": None
    }
    res = client.post("/api/voice/extract-entities", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["reported_location"] == "Not specified in audio"
    assert data["people_affected"] == "Unknown / Not specified"
    assert len(data["unknown_fields"]) > 0
    assert any("location" in u.lower() for u in data["unknown_fields"])
    assert any("casualty" in u.lower() for u in data["unknown_fields"])

def test_consecutive_recordings_isolation():
    """Verify consecutive transcriptions have unique correlation IDs and do not leak previous audio."""
    with patch("app.api.voice.transcribe_audio_payload") as mock_stt:
        mock_stt.side_effect = [
            {"status": "SUCCESS", "correlation_id": "corr_1", "transcript": "first recording", "confidence": 0.9, "extracted_entities": None},
            {"status": "SUCCESS", "correlation_id": "corr_2", "transcript": "second recording", "confidence": 0.9, "extracted_entities": None}
        ]
        sample_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00" + b"\x00" * 300)
        res1 = client.post("/api/voice/transcriptions", files={"audio": ("1.wav", sample_audio, "audio/wav")})
        sample_audio.seek(0)
        res2 = client.post("/api/voice/transcriptions", files={"audio": ("2.wav", sample_audio, "audio/wav")})

        assert res1.json()["transcript"] == "first recording"
        assert res2.json()["transcript"] == "second recording"
        assert res1.json()["correlation_id"] != res2.json()["correlation_id"]

def test_tirupati_bus_stand_lorry_car_collision_regression():
    """
    Regression Test for Section 7.3:
    Transcript describing a lorry colliding with a car, five affected people, severe bleeding,
    unconscious people and a location at Tirupati bus stand:
    - Extract location reference to Tirupati bus stand.
    - Preserve original transcript verbatim.
    - Record five affected people as reported, not independently verified.
    - Preserve reported bleeding and unconsciousness as unverified caller reports.
    - Recommend urgent operator review under defined triage policy.
    - Never silently replace location with a different landmark.
    """
    transcript = "A lorry collided with a car near the bus stand in Tirupati, five affected people, severe bleeding and unconscious people on scene."
    res = client.post("/api/voice/extract-entities", json={"transcript": transcript})
    assert res.status_code == 200
    data = res.json()

    # 1. Location extracted without silent replacement
    assert "bus stand in tirupati" in data["reported_location"].lower() or "tirupati bus stand" in data["reported_location"].lower()
    # 2. Original transcript preserved
    assert data["original_transcript"] == transcript
    # 3. Five affected people recorded
    assert data["people_affected"] == "5" or data["affected_people_count"] == "5"
    # 4. Severe bleeding and unconsciousness preserved
    assert any("bleeding" in inj.lower() for inj in data["reported_injuries"])
    assert any("unconscious" in inj.lower() for inj in data["reported_injuries"])
    # 5. Observed severity is CRITICAL and urgent review recommended
    assert data["observed_severity"] == "CRITICAL"
    assert data["triage_recommendation"] == "URGENT_OPERATOR_REVIEW"


