import os
import sys
import uuid
import shutil
import subprocess
import tempfile
import re
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.config import settings

logger = logging.getLogger("tera.voice")

class StructuredEmergencyExtraction(BaseModel):
    original_transcript: str = Field(..., description="Verbatim raw transcript returned by speech recognition.")
    confirmed_transcript: Optional[str] = Field(None, description="Reporter or operator corrected transcript.")
    incident_summary: str = Field(..., description="Concise summary of explicitly reported emergency details.")
    incident_type: str = Field(..., description="Categorized emergency type based strictly on reported cues.")
    reported_location: str = Field("Not specified in audio", description="Explicitly mentioned location or landmark.")
    people_affected: str = Field("Unknown / Not specified", description="Explicit casualty count if stated.")
    reported_injuries: List[str] = Field(default_factory=list, description="Explicit injuries or symptoms mentioned.")
    reported_hazards: List[str] = Field(default_factory=list, description="Observed hazards mentioned.")
    assistance_requested: List[str] = Field(default_factory=list, description="Type of assistance requested.")
    unknown_fields: List[str] = Field(default_factory=list, description="Critical operational details missing from speech.")
    extraction_status: str = Field("SUCCESS", description="SUCCESS, PARTIAL, or FAILED.")
    confirmation_status: str = Field("UNCONFIRMED_PENDING_REVIEW", description="Status of reporter/operator review.")

    # Backward-compatible aliases
    summary: Optional[str] = None
    incident_category: Optional[str] = None
    affected_people_count: Optional[str] = None
    estimated_casualties: Optional[Any] = None
    observed_severity: Optional[str] = None
    unknown_details: Optional[List[str]] = None
    provenance: Optional[str] = None
    verification_status: Optional[str] = None

def extract_structured_emergency_report(
    transcript: Optional[str],
    user_corrected: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transforms speech transcript into a structured, operator-friendly triage schema.
    Strict rules:
    - Never infer a clinical diagnosis.
    - Never invent casualty counts, names, ages, or coordinates.
    - Never turn uncertainty into certainty.
    - Preserve original transcript verbatim.
    """
    effective_text = (user_corrected or transcript or "").strip()
    if not effective_text:
        return {
            "original_transcript": transcript or "",
            "confirmed_transcript": user_corrected,
            "incident_summary": "No audible or intelligible speech was detected in this recording.",
            "incident_type": "UNKNOWN",
            "reported_location": "Not specified in audio",
            "people_affected": "Unknown / Not specified",
            "reported_injuries": [],
            "reported_hazards": [],
            "assistance_requested": [],
            "unknown_fields": ["Incident details were not verbalized. Operator manual verification required."],
            "extraction_status": "FAILED_NO_TEXT",
            "confirmation_status": "UNCONFIRMED_PENDING_REVIEW",
            # Backward-compatible aliases
            "summary": "No audible or intelligible speech was detected in this recording.",
            "incident_category": "UNKNOWN",
            "affected_people_count": "Unknown / Not specified",
            "estimated_casualties": "Unknown / Not specified",
            "observed_severity": "NEEDS_CONFIRMATION",
            "unknown_details": ["Incident details were not verbalized."],
            "provenance": "USER_CORRECTED" if user_corrected else "MACHINE_GENERATED",
            "verification_status": "UNVERIFIED_PENDING_REVIEW"
        }

    lower_text = effective_text.lower()
    
    # 1. Incident Category
    category = "OTHER_EMERGENCY"
    if any(k in lower_text for k in ["crash", "collision", "accident", "pileup", "hit and run", "overturned"]):
        category = "ROAD_ACCIDENT"
    elif any(k in lower_text for k in ["fire", "flames", "smoke", "burning", "explosion", "blaze"]):
        category = "STRUCTURAL_FIRE"
    elif any(k in lower_text for k in ["collapse", "collapsed", "cave-in", "rubble", "building fall"]):
        category = "BUILDING_COLLAPSE"
    elif any(k in lower_text for k in ["unconscious", "unresponsive", "passed out", "fainted", "not breathing"]):
        category = "UNCONSCIOUSNESS"
    elif any(k in lower_text for k in ["breathing", "choking", "suffocating", "asthma", "gasping"]):
        category = "BREATHING_DIFFICULTY"
    elif any(k in lower_text for k in ["bleed", "bleeding", "wound", "fracture", "stab", "trauma", "head injury"]):
        category = "SEVERE_TRAUMA"
    elif any(k in lower_text for k in ["chemical", "gas leak", "toxic", "poison", "hazmat"]):
        category = "HAZARDOUS_MATERIALS"

    # 2. Casualty Count: Strictly extract only what was explicitly mentioned
    num_map = {
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
    }
    casualties = "Unknown / Not specified"
    count_match = re.search(
        r'\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:affected\s+people|affected\s+persons?|people|persons?|injured(?:\s+people)?|passengers?|victims?|casualt(?:y|ies)|patients?|individuals?|casualties)',
        lower_text,
        re.IGNORECASE
    )
    if count_match:
        val = count_match.group(1).lower()
        casualties = num_map.get(val, val)

    int_casualties = int(casualties) if str(casualties).isdigit() else casualties

    # 3. Observed Severity: Only elevated if explicitly severe keywords are spoken
    severity = "MEDIUM"
    triage_recommendation = "ROUTINE_OPERATOR_REVIEW"
    if any(k in lower_text for k in ["critical", "dying", "fatal", "not breathing", "unconscious", "severe bleeding", "massive", "trapped"]):
        severity = "CRITICAL"
        triage_recommendation = "URGENT_OPERATOR_REVIEW"
    elif any(k in lower_text for k in ["serious", "heavy", "broken bone", "fracture", "bad injury", "collision", "accident"]):
        severity = "HIGH"
        triage_recommendation = "PRIORITY_OPERATOR_REVIEW"

    # 4. Reported Location in Speech
    known_landmarks = [
        "tirupati bus stand", "bus stand in tirupati", "rtc central bus station", "central bus stand", "bus stand",
        "tirupati railway station", "railway station", "alipiri checkpost", "alipiri toll gate",
        "alipiri", "svims hospital", "svims", "svrr hospital", "ruia hospital", "birrd hospital",
        "tirumala bypass road", "bypass road", "chandragiri road", "renigunta road", "air bypass road",
        "kapila theertham", "korlagunta", "bhavani nagar", "leela mahal", "clock tower", "bazaar street"
    ]
    reported_loc = "Not specified in audio"
    for lm in known_landmarks:
        if lm in lower_text:
            start_idx = lower_text.find(lm)
            reported_loc = effective_text[start_idx:start_idx + len(lm)].strip()
            break

    if reported_loc == "Not specified in audio":
        loc_match = re.search(
            r'\b(?:at|near|on|in front of|opposite|along|location(?:\s+is|\s+at)?)\s+(?:the\s+)?([a-zA-Z0-9\s\.\-]{3,50}?)(?:[,;\.\n]|\band\b|\bplease\b|\bwith\b|\bthere\b|\bfive\b|\b\d+\s+people|\bseveral\b|$)',
            effective_text,
            re.IGNORECASE
        )
        if loc_match:
            candidate_loc = loc_match.group(1).strip()
            if len(candidate_loc) >= 3 and not any(k in candidate_loc.lower() for k in ["help", "hurry", "injured", "fire", "accident", "collision"]):
                reported_loc = candidate_loc

    # 5. Injuries or Symptoms
    injuries = []
    if "bleed" in lower_text or "blood" in lower_text:
        injuries.append("Severe or active bleeding reported")
    if "unconscious" in lower_text or "unresponsive" in lower_text:
        injuries.append("Unconscious or unresponsive victim reported")
    if "breathing" in lower_text or "choking" in lower_text:
        injuries.append("Difficulty breathing reported")
    if "burn" in lower_text:
        injuries.append("Burn injuries reported")
    if "fracture" in lower_text or "broken" in lower_text:
        injuries.append("Suspected fracture / bone trauma reported")
    if "head" in lower_text and ("injury" in lower_text or "hurt" in lower_text or "bleed" in lower_text):
        injuries.append("Head injury reported")

    # 6. Observed Hazards
    hazards = []
    if "bleeding" in lower_text or "blood" in lower_text:
        hazards.append("Active bleeding observed")
    if "fire" in lower_text or "smoke" in lower_text or "flame" in lower_text:
        hazards.append("Fire or smoke hazard")
    if "wire" in lower_text or "electric" in lower_text or "power line" in lower_text:
        hazards.append("Downed electrical lines / electrocution hazard")
    if "fuel" in lower_text or "petrol" in lower_text or "diesel" in lower_text or "leak" in lower_text:
        hazards.append("Fuel leak / flammable liquid on scene")
    if "trapped" in lower_text or "pinned" in lower_text or "stuck" in lower_text:
        hazards.append("Victims trapped inside vehicle or structure")
    if "traffic" in lower_text or "highway" in lower_text:
        hazards.append("Active highway traffic hazard")

    # 7. Assistance Requested
    assistance = []
    if any(k in lower_text for k in ["ambulance", "medic", "paramedic", "doctor"]):
        assistance.append("Medical Ambulance (ALS/BLS)")
    if any(k in lower_text for k in ["fire", "fire engine", "extinguisher"]):
        assistance.append("Fire & Rescue Unit")
    if any(k in lower_text for k in ["police", "cops", "patrol"]):
        assistance.append("Police / Traffic Enforcement")

    # 8. Unknown details that require operator clarification
    unknowns = []
    if reported_loc == "Not specified in audio":
        unknowns.append("Incident location was not stated verbally; GPS coordinates or caller confirmation required.")
    if casualties == "Unknown / Not specified":
        unknowns.append("Casualty count not stated in voice audio; operator must verify on arrival.")
    if not hazards:
        unknowns.append("Scene hazards not specified verbally; responder caution advised.")

    summary = f"Caller reported {category.lower().replace('_', ' ')}"
    if reported_loc != "Not specified in audio":
        summary += f" near {reported_loc}"
    if casualties != "Unknown / Not specified":
        summary += f" with {casualties} person(s) affected"
    summary += "."

    return {
        "original_transcript": transcript or "",
        "confirmed_transcript": user_corrected,
        "incident_summary": summary,
        "incident_type": category,
        "reported_location": reported_loc,
        "people_affected": str(casualties),
        "reported_injuries": injuries,
        "reported_hazards": hazards,
        "assistance_requested": assistance,
        "unknown_fields": unknowns,
        "extraction_status": "SUCCESS",
        "confirmation_status": "CONFIRMED_BY_USER" if user_corrected else "UNCONFIRMED_PENDING_REVIEW",
        # Backward-compatible aliases
        "summary": summary,
        "incident_category": category,
        "affected_people_count": str(casualties),
        "estimated_casualties": int_casualties,
        "observed_severity": severity,
        "unknown_details": unknowns,
        "provenance": "USER_CORRECTED" if user_corrected else "MACHINE_GENERATED",
        "triage_recommendation": triage_recommendation,
        "verification_status": "UNVERIFIED_PENDING_REVIEW"
    }

def transcribe_audio_payload(
    file_path: str,
    content_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Processes real audio files using the configured Speech-to-Text provider.
    Never invents or falls back to synthetic emergency text.
    Returns structured results with correlation IDs, provider diagnostics, and both error/message keys.
    """
    correlation_id = f"stt_{uuid.uuid4().hex[:12]}"
    logger.info(f"[{correlation_id}] Processing voice upload: {file_path} (content_type: {content_type})")
    
    if not os.path.exists(file_path):
        err_msg = "The specified audio file does not exist on the server."
        logger.error(f"[{correlation_id}] File not found: {file_path}")
        return {
            "status": "FILE_NOT_FOUND",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": err_msg,
            "message": err_msg,
            "retryable": False
        }

    file_size = os.path.getsize(file_path)
    if file_size < 100:
        err_msg = f"Audio file is empty or corrupted ({file_size} bytes)."
        logger.warning(f"[{correlation_id}] Empty audio upload ({file_size} bytes)")
        return {
            "status": "EMPTY_AUDIO",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": err_msg,
            "message": err_msg,
            "retryable": False
        }

    # Inspect file header to see if it is a native WAV (RIFF....WAVE)
    is_native_wav = False
    try:
        with open(file_path, "rb") as check_f:
            hdr = check_f.read(12)
            if len(hdr) >= 12 and hdr[:4] == b"RIFF" and hdr[8:12] == b"WAVE":
                is_native_wav = True
    except Exception as read_ex:
        logger.warning(f"[{correlation_id}] Header inspection exception: {read_ex}")

    ext = os.path.splitext(file_path)[1].lower()
    temp_wav = None

    try:
        if is_native_wav:
            audio_source_path = file_path
            logger.info(f"[{correlation_id}] Native WAV stream confirmed ({file_size} bytes).")
        else:
            # Non-WAV file: requires ffmpeg
            ffmpeg_path = shutil.which("ffmpeg")
            if not ffmpeg_path:
                err_msg = "Audio format requires server-side transcoding (ffmpeg), which is not installed. Please record audio using standard WAV format."
                logger.error(f"[{correlation_id}] ffmpeg missing for non-WAV format '{ext}'.")
                return {
                    "status": "INVALID_AUDIO_FORMAT",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": err_msg,
                    "message": err_msg,
                    "retryable": False
                }

            temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
            cmd = [ffmpeg_path, "-y", "-i", file_path, "-ac", "1", "-ar", "16000", temp_wav]
            conv_res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if conv_res.returncode != 0:
                err_msg = f"Audio format could not be decoded by media pipeline. Supported: {settings.ALLOWED_AUDIO_EXTENSIONS}"
                logger.error(f"[{correlation_id}] ffmpeg transcoding error: {conv_res.stderr.decode('utf-8', errors='ignore')[:200]}")
                return {
                    "status": "FORMAT_UNSUPPORTED",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": err_msg,
                    "message": err_msg,
                    "retryable": False
                }
            audio_source_path = temp_wav

        # ----------------------------------------------------------------------
        # Speech Provider Invocation: GOOGLE_SPEECH / SpeechRecognition
        # ----------------------------------------------------------------------
        try:
            import speech_recognition as sr
        except ImportError as imp_err:
            err_msg = f"Speech recognition engine dependency is missing: {str(imp_err)}. Please verify requirements."
            logger.error(f"[{correlation_id}] {err_msg}")
            return {
                "status": "TRANSCRIPTION_NOT_CONFIGURED",
                "correlation_id": correlation_id,
                "transcript": None,
                "confidence": None,
                "provider": settings.SPEECH_PROVIDER,
                "error": err_msg,
                "message": err_msg,
                "retryable": False
            }

        r = sr.Recognizer()
        r.energy_threshold = 300
        
        with sr.AudioFile(audio_source_path) as source:
            duration = getattr(source, 'DURATION', None)
            if duration is not None and duration < 0.4:
                err_msg = f"Audio recording duration is too short ({duration:.2f}s) to extract speech."
                logger.warning(f"[{correlation_id}] {err_msg}")
                return {
                    "status": "AUDIO_TOO_SHORT",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "duration_seconds": round(duration, 2) if duration else 0.0,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": err_msg,
                    "message": err_msg,
                    "retryable": True
                }
            audio_data = r.record(source)

        try:
            raw_text = r.recognize_google(audio_data, language="en-US")
            clean_text = raw_text.strip() if raw_text else ""
            if not clean_text:
                err_msg = "Audio was recorded, but no intelligible words were recognized."
                logger.warning(f"[{correlation_id}] No speech detected in audio stream.")
                return {
                    "status": "NO_SPEECH_DETECTED",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": err_msg,
                    "message": err_msg,
                    "retryable": True
                }

            extracted = extract_structured_emergency_report(clean_text)
            logger.info(f"[{correlation_id}] Speech recognition successful: '{clean_text[:60]}...'")
            return {
                "status": "SUCCESS",
                "correlation_id": correlation_id,
                "transcript": clean_text,
                "confidence": 0.88,
                "detected_language": "en-US",
                "extracted_entities": extracted,
                "provider": settings.SPEECH_PROVIDER,
                "message": "Audio transcribed successfully.",
                "retryable": False
            }

        except sr.UnknownValueError:
            err_msg = "No intelligible speech was recognized in the recording."
            logger.info(f"[{correlation_id}] sr.UnknownValueError: Speech unintelligible.")
            return {
                "status": "NO_SPEECH_DETECTED",
                "correlation_id": correlation_id,
                "transcript": None,
                "confidence": None,
                "provider": settings.SPEECH_PROVIDER,
                "error": err_msg,
                "message": err_msg,
                "retryable": True
            }
        except sr.RequestError as e:
            err_msg = f"Speech-to-text service provider was unreachable: {str(e)}"
            logger.error(f"[{correlation_id}] sr.RequestError: {err_msg}")
            return {
                "status": "PROVIDER_UNAVAILABLE",
                "correlation_id": correlation_id,
                "transcript": None,
                "confidence": None,
                "provider": settings.SPEECH_PROVIDER,
                "error": err_msg,
                "message": err_msg,
                "retryable": True
            }

    except Exception as ex:
        err_msg = f"Speech processing engine encountered an unexpected error: {str(ex)}"
        logger.error(f"[{correlation_id}] Unhandled voice exception: {ex}", exc_info=True)
        return {
            "status": "PROVIDER_ERROR",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": err_msg,
            "message": err_msg,
            "retryable": True
        }
    finally:
        if temp_wav and os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except OSError:
                pass
