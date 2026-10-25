import os
import uuid
import subprocess
import tempfile
import re
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from app.config import settings
from app.api.auth import get_current_user
from app.models.models import UserAccount

router = APIRouter(prefix="/evidence", tags=["Evidence & Voice Ingestion"])

from app.services.voice_service import (
    transcribe_audio_payload,
    extract_structured_emergency_report
)

def extract_entities_from_transcript(transcript: Optional[str]) -> Dict[str, Any]:
    return extract_structured_emergency_report(transcript)

def transcribe_audio_file(file_path: str, ext: str) -> Dict[str, Any]:
    return transcribe_audio_payload(file_path)


@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    incident_id: Optional[str] = Form(None),
    media_category: str = Form("PHOTO"),  # PHOTO, AUDIO_VOICE, AUDIO_DISPATCH, DOCUMENT
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Secure Evidence & Audio Ingestion Endpoint.
    - Validates file extensions and size limit.
    - Stores file with sanitized UUID filename.
    - Transcribes voice notes using real speech-to-text (never returns canned text).
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = settings.ALLOWED_IMAGE_EXTENSIONS + settings.ALLOWED_AUDIO_EXTENSIONS + [".pdf", ".webm", ".ogg"]
    
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions: {allowed_exts}"
        )
        
    # Read content with size check
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
        
    unique_name = f"evd_{uuid.uuid4().hex[:12]}{ext}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    target_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    with open(target_path, "wb") as f:
        f.write(content)
        
    result: Dict[str, Any] = {
        "evidence_id": f"EVD_{uuid.uuid4().hex[:8].upper()}",
        "original_filename": file.filename,
        "saved_filename": unique_name,
        "media_category": media_category.upper(),
        "url": f"/api/evidence/files/{unique_name}",
        "file_url": f"/api/evidence/files/{unique_name}",
        "size_bytes": len(content),
        "content_type": file.content_type
    }
    
    # Process Voice Note if Audio
    is_audio = ext in settings.ALLOWED_AUDIO_EXTENSIONS or ext in [".webm", ".ogg", ".wav", ".mp3", ".m4a"] or media_category.upper().startswith("AUDIO")
    if is_audio:
        stt_result = transcribe_audio_file(target_path, ext)
        result["speech_to_text"] = stt_result
        result["transcript"] = stt_result.get("transcript")
        result["transcription_status"] = stt_result.get("status")
        result["transcription_message"] = stt_result.get("message")
        
    return result

@router.get("/files/{filename}")
async def get_evidence_file(filename: str):
    """Safely serves uploaded evidence files, guarding against directory traversal."""
    safe_name = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found")
        
    from fastapi.responses import FileResponse
    return FileResponse(file_path)
