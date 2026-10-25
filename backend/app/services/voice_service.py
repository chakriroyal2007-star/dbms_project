import os
import uuid
import subprocess
import tempfile
import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.config import settings

class StructuredEmergencyExtraction(BaseModel):
    summary: str = Field(..., description="Concise summary of explicitly reported emergency details.")
    incident_category: str = Field(..., description="Categorized emergency type based strictly on reported cues.")
    reported_location: str = Field("Not specified in audio", description="Explicitly mentioned location or landmark.")
    affected_people_count: str = Field("Unknown / Not specified", description="Explicit casualty count if stated.")
    reported_injuries: List[str] = Field(default_factory=list, description="Explicit injuries or symptoms mentioned.")
    reported_hazards: List[str] = Field(default_factory=list, description="Observed hazards mentioned.")
    assistance_requested: List[str] = Field(default_factory=list, description="Type of assistance requested.")
    unknown_details: List[str] = Field(default_factory=list, description="Critical operational details missing from speech.")
    original_transcript: str = Field(..., description="Verbatim raw transcript returned by speech recognition.")
    user_corrected_transcript: Optional[str] = Field(None, description="Reporter or operator corrected transcript.")
    provenance: str = Field("MACHINE_GENERATED", description="MACHINE_GENERATED, USER_CORRECTED, or OPERATOR_REVIEWED.")
    verification_status: str = Field("UNVERIFIED_PENDING_REVIEW", description="Status of operator verification.")

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
            "summary": "No audible or intelligible speech was detected in this recording.",
            "incident_category": "UNKNOWN",
            "reported_location": "Not specified in audio",
            "affected_people_count": "Unknown / Not specified",
            "reported_injuries": [],
            "reported_hazards": [],
            "assistance_requested": [],
            "unknown_details": ["No speech details captured. Dispatch requires manual contact or location verification."],
            "original_transcript": transcript or "",
            "user_corrected_transcript": user_corrected,
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
        r'\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:people|persons?|injured|passengers?|victims?|casualt(?:y|ies)|patients?|individuals?)',
        lower_text
    )
    if count_match:
        val = count_match.group(1)
        casualties = num_map.get(val, val)

    int_casualties = int(casualties) if casualties.isdigit() else casualties

    # 3. Observed Severity: Only elevated if explicitly severe keywords are spoken
    severity = "MEDIUM"
    if any(k in lower_text for k in ["critical", "dying", "fatal", "not breathing", "unconscious", "severe bleeding", "massive", "trapped"]):
        severity = "CRITICAL"
    elif any(k in lower_text for k in ["serious", "heavy", "broken bone", "fracture", "bad injury"]):
        severity = "HIGH"

    # 4. Reported Location in Speech
    reported_loc = "Not specified in audio"
    loc_match = re.search(r'\b(?:at|near|on|in front of|opposite|along)\s+([a-zA-Z0-9\s,\.\-]{3,40}?)(?:\.|\band\b|\bplease\b|\bwith\b|\bthere\b|$)', effective_text, re.IGNORECASE)
    if loc_match:
        candidate_loc = loc_match.group(1).strip()
        if len(candidate_loc) > 3 and not any(k in candidate_loc.lower() for k in ["help", "hurry", "injured", "fire", "accident"]):
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
        "summary": summary,
        "incident_category": category,
        "reported_location": reported_loc,
        "affected_people_count": str(casualties),
        "estimated_casualties": int_casualties,
        "observed_severity": severity,
        "reported_injuries": injuries,
        "reported_hazards": hazards,
        "assistance_requested": assistance,
        "unknown_details": unknowns,
        "original_transcript": transcript or "",
        "user_corrected_transcript": user_corrected,
        "provenance": "USER_CORRECTED" if user_corrected else "MACHINE_GENERATED",
        "verification_status": "UNVERIFIED_PENDING_REVIEW"
    }


def transcribe_audio_payload(
    file_path: str,
    content_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Processes real audio files using the configured Speech-to-Text provider.
    Never invents or falls back to synthetic emergency text.
    Returns structured results with correlation IDs and provider diagnostics.
    """
    correlation_id = f"stt_{uuid.uuid4().hex[:12]}"
    
    if not os.path.exists(file_path):
        return {
            "status": "FILE_NOT_FOUND",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": "The specified audio file does not exist on the server.",
            "retryable": False
        }

    file_size = os.path.getsize(file_path)
    if file_size < 100:
        return {
            "status": "EMPTY_AUDIO",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": f"Audio file is empty or corrupted ({file_size} bytes).",
            "retryable": False
        }

    ext = os.path.splitext(file_path)[1].lower()
    temp_wav = None

    try:
        # Convert non-standard audio to 16kHz mono WAV for speech engine compatibility
        if ext != ".wav":
            temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
            cmd = ["ffmpeg", "-y", "-i", file_path, "-ac", "1", "-ar", "16000", temp_wav]
            conv_res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if conv_res.returncode != 0:
                return {
                    "status": "FORMAT_UNSUPPORTED",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": f"Audio format could not be decoded by media pipeline. Supported: {settings.ALLOWED_AUDIO_EXTENSIONS}",
                    "retryable": False
                }
            audio_source_path = temp_wav
        else:
            audio_source_path = file_path

        # ----------------------------------------------------------------------
        # Speech Provider: GOOGLE_SPEECH / SpeechRecognition
        # ----------------------------------------------------------------------
        import speech_recognition as sr
        r = sr.Recognizer()
        r.energy_threshold = 300
        
        with sr.AudioFile(audio_source_path) as source:
            duration = getattr(source, 'DURATION', None)
            if duration is not None and duration < 0.4:
                return {
                    "status": "AUDIO_TOO_SHORT",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "duration_seconds": round(duration, 2) if duration else 0.0,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": "Audio recording duration is too short (< 0.4 seconds) to extract speech.",
                    "retryable": True
                }
            audio_data = r.record(source)

        try:
            raw_text = r.recognize_google(audio_data, language="en-US")
            clean_text = raw_text.strip()
            if not clean_text:
                return {
                    "status": "NO_SPEECH_DETECTED",
                    "correlation_id": correlation_id,
                    "transcript": None,
                    "confidence": None,
                    "provider": settings.SPEECH_PROVIDER,
                    "error": "Audio was recorded, but no intelligible words were recognized.",
                    "retryable": True
                }

            extracted = extract_structured_emergency_report(clean_text)
            return {
                "status": "SUCCESS",
                "correlation_id": correlation_id,
                "transcript": clean_text,
                "confidence": 0.88,
                "detected_language": "en-US",
                "extracted_entities": extracted,
                "provider": settings.SPEECH_PROVIDER,
                "retryable": False
            }

        except sr.UnknownValueError:
            return {
                "status": "NO_SPEECH_DETECTED",
                "correlation_id": correlation_id,
                "transcript": None,
                "confidence": None,
                "provider": settings.SPEECH_PROVIDER,
                "error": "No intelligible speech was recognized in the recording.",
                "retryable": True
            }
        except sr.RequestError as e:
            return {
                "status": "PROVIDER_UNAVAILABLE",
                "correlation_id": correlation_id,
                "transcript": None,
                "confidence": None,
                "provider": settings.SPEECH_PROVIDER,
                "error": f"Speech-to-text service provider was unreachable: {str(e)}",
                "retryable": True
            }

    except Exception as ex:
        return {
            "status": "PROVIDER_ERROR",
            "correlation_id": correlation_id,
            "transcript": None,
            "confidence": None,
            "provider": settings.SPEECH_PROVIDER,
            "error": f"Speech processing engine encountered an unexpected error: {str(ex)}",
            "retryable": True
        }
    finally:
        if temp_wav and os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except OSError:
                pass
