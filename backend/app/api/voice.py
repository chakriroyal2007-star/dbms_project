import os
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from pydantic import BaseModel
from app.config import settings
from app.api.auth import get_current_user
from app.models.models import UserAccount
from app.services.voice_service import (
    transcribe_audio_payload,
    extract_structured_emergency_report
)

router = APIRouter(prefix="/voice", tags=["Voice Agent & Speech Transcription API"])

class ExtractEntitiesRequest(BaseModel):
    transcript: str
    user_corrected: Optional[str] = None

class CorrectTranscriptRequest(BaseModel):
    incident_id: Optional[str] = None
    original_transcript: str
    user_corrected_transcript: str

@router.get("/health")
def voice_service_health():
    """
    Inspects voice processing configuration and provider status.
    """
    return {
        "status": "ONLINE",
        "provider": settings.SPEECH_PROVIDER,
        "supported_audio_formats": settings.ALLOWED_AUDIO_EXTENSIONS,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
        "models": ["Google Speech API", "OpenAI Whisper Adapter", "Local Recognizer"],
        "disclaimer": "Live emergency transcriptions require audible microphone input. Synthetic fallbacks are disabled."
    }

@router.post("/transcriptions")
async def create_voice_transcription(
    audio: UploadFile = File(..., description="Audio recording file (wav, webm, mp3, ogg, m4a)"),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Official Versioned Speech-to-Text Transcription Endpoint (POST /api/voice/transcriptions & /api/v1/voice/transcriptions).
    - Accepts actual microphone audio upload.
    - Rejects empty, corrupted, or oversized audio.
    - Sanitizes filenames and avoids directory traversal.
    - Invokes configured speech-to-text adapter.
    - Returns provider's actual transcript, confidence, and structured triage fields.
    - Never falls back to canned or pre-fabricated emergency sentences.
    """
    if not audio.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    ext = os.path.splitext(audio.filename)[1].lower()
    allowed_exts = settings.ALLOWED_AUDIO_EXTENSIONS + [".wav", ".webm", ".ogg", ".mp3", ".m4a"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format '{ext}'. Allowed extensions: {allowed_exts}"
        )

    # Read binary content
    content = await audio.read()
    if len(content) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio recording is empty or corrupt. Please speak clearly into the microphone."
        )

    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file ({size_mb:.1f}MB) exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Store securely in upload vault
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"voice_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(target_path, "wb") as f:
        f.write(content)

    # Run genuine speech recognition
    stt_res = transcribe_audio_payload(target_path, content_type=audio.content_type)
    
    # Check for service outage or provider errors
    if stt_res.get("status") in ["PROVIDER_UNAVAILABLE", "PROVIDER_ERROR"]:
        # Return 503 with structured correlation info rather than fake canned text
        return {
            "success": False,
            "status": stt_res["status"],
            "correlation_id": stt_res.get("correlation_id"),
            "provider": stt_res.get("provider"),
            "transcript": None,
            "message": stt_res.get("error"),
            "retryable": stt_res.get("retryable", True),
            "audio_file_url": f"/api/evidence/files/{safe_name}"
        }

    return {
        "success": stt_res.get("status") == "SUCCESS",
        "status": stt_res.get("status"),
        "correlation_id": stt_res.get("correlation_id"),
        "transcript": stt_res.get("transcript"),
        "confidence": stt_res.get("confidence"),
        "detected_language": stt_res.get("detected_language"),
        "extracted_entities": stt_res.get("extracted_entities"),
        "audio_file_url": f"/api/evidence/files/{safe_name}",
        "message": stt_res.get("error") if stt_res.get("status") != "SUCCESS" else "Audio processed successfully."
    }

@router.post("/extract-entities")
def extract_emergency_entities(payload: ExtractEntitiesRequest):
    """
    Deterministic extraction of operational triage fields from raw or corrected transcript.
    Never hallucinates unstated facts or clinical diagnoses.
    """
    return extract_structured_emergency_report(
        transcript=payload.transcript,
        user_corrected=payload.user_corrected
    )

@router.post("/correct-transcript")
def correct_transcript(payload: CorrectTranscriptRequest):
    """
    Allows callers or operators to submit verified transcript corrections.
    Preserves original transcript while recording user_corrected version separately.
    """
    extracted = extract_structured_emergency_report(
        transcript=payload.original_transcript,
        user_corrected=payload.user_corrected_transcript
    )
    return {
        "status": "SUCCESS",
        "original_transcript": payload.original_transcript,
        "user_corrected_transcript": payload.user_corrected_transcript,
        "provenance": "USER_CORRECTED",
        "extracted_entities": extracted
    }
