"""
TERA Operational Readiness & Dispatch Completeness Engine (Version 2.0)
Calculates transparent, versioned operational dispatch readiness.
Distinct from clinical severity and triage priority.
"""
import datetime
from typing import Dict, Any, Optional

FORMULA_VERSION = "2.0.0-PROD"

def calculate_operational_readiness_score(
    latitude: Optional[float],
    longitude: Optional[float],
    location_accuracy_meters: Optional[float],
    location_name: Optional[str],
    landmark: Optional[str],
    description: Optional[str],
    incident_type: Optional[str],
    estimated_patient_count: Optional[int],
    injuries_reported: Optional[str],
    hazards_reported: Optional[str],
    reporter_contact: Optional[str],
    has_audio_transcript: bool = False,
    has_photo_evidence: bool = False
) -> Dict[str, Any]:
    """
    Evaluates operational dispatch readiness across 6 transparent dimensions:
    1. Location Quality (max 25 pts)
    2. Situation Description Completeness (max 20 pts)
    3. Casualty / Patient Specificity (max 20 pts)
    4. Hazard & Environmental Safety (max 15 pts)
    5. Contact & Callback Verification (max 10 pts)
    6. Audio / Visual Evidence Manifest (max 10 pts)
    Total Max: 100 pts.
    """
    components = {}

    # 1. Location Quality (25 pts)
    loc_score = 0
    loc_notes = []
    has_coords = (latitude is not None and longitude is not None and abs(latitude) > 0.001 and abs(longitude) > 0.001)
    if has_coords:
        loc_score += 15
        loc_notes.append("GPS coordinates recorded (+15)")
        if location_accuracy_meters is not None and location_accuracy_meters <= 30:
            loc_score += 5
            loc_notes.append(f"High-precision GPS: {location_accuracy_meters}m (+5)")
        elif location_accuracy_meters is not None:
            loc_score += 2
            loc_notes.append(f"Standard GPS accuracy: {location_accuracy_meters}m (+2)")
    else:
        loc_notes.append("GPS coordinates missing (0/15)")

    if landmark and len(landmark.strip()) >= 3:
        loc_score += 5
        loc_notes.append("Landmark/cross-street identified (+5)")
    elif location_name and len(location_name.strip()) >= 5:
        loc_score += 3
        loc_notes.append("Recognizable locality name provided (+3)")
    else:
        loc_notes.append("Specific landmark not identified (0/5)")

    components["location_quality"] = {
        "score": min(25, loc_score),
        "max": 25,
        "details": "; ".join(loc_notes),
        "status": "EXCELLENT" if loc_score >= 20 else ("ACCEPTABLE" if loc_score >= 12 else "MARGINAL")
    }

    # 2. Situation Description Completeness (20 pts)
    desc_score = 0
    desc_notes = []
    desc_text = (description or "").strip()
    if len(desc_text) >= 50:
        desc_score += 12
        desc_notes.append("Comprehensive narrative provided (+12)")
    elif len(desc_text) >= 15:
        desc_score += 8
        desc_notes.append("Basic narrative provided (+8)")
    elif len(desc_text) > 0:
        desc_score += 4
        desc_notes.append("Brief statement provided (+4)")
    else:
        desc_notes.append("Narrative description missing (0/12)")

    if incident_type and incident_type not in ["OTHER", "UNKNOWN", ""]:
        desc_score += 8
        desc_notes.append(f"Specific emergency classification: {incident_type} (+8)")
    else:
        desc_score += 3
        desc_notes.append("Generic or unclassified emergency (+3)")

    components["description_completeness"] = {
        "score": min(20, desc_score),
        "max": 20,
        "details": "; ".join(desc_notes),
        "status": "COMPLETE" if desc_score >= 16 else ("ADEQUATE" if desc_score >= 10 else "INCOMPLETE")
    }

    # 3. Casualty & Injury Specificity (20 pts)
    cas_score = 0
    cas_notes = []
    if estimated_patient_count is not None and estimated_patient_count > 0:
        cas_score += 10
        cas_notes.append(f"Specific affected casualty count ({estimated_patient_count}) verified (+10)")
    else:
        cas_score += 4
        cas_notes.append("Casualty count is unspecified / unknown (+4 baseline)")

    inj_text = (injuries_reported or "").strip()
    if len(inj_text) >= 10:
        cas_score += 10
        cas_notes.append("Specific injury or trauma details reported (+10)")
    elif len(inj_text) > 0:
        cas_score += 5
        cas_notes.append("General injury observation recorded (+5)")
    else:
        cas_notes.append("Detailed injury presentation not yet documented (0/10)")

    components["casualty_specificity"] = {
        "score": min(20, cas_score),
        "max": 20,
        "details": "; ".join(cas_notes),
        "status": "DETAILED" if cas_score >= 15 else ("BASIC" if cas_score >= 8 else "UNKNOWN")
    }

    # 4. Hazard & Safety Identification (15 pts)
    haz_score = 0
    haz_notes = []
    haz_text = (hazards_reported or "").strip()
    if len(haz_text) >= 8:
        haz_score += 15
        haz_notes.append(f"Identified hazard factors: '{haz_text}' (+15)")
    elif incident_type in ["FIRE_HAZARD", "ROAD_ACCIDENT", "COLLAPSE"]:
        haz_score += 10
        haz_notes.append(f"Environmental hazard implied by category {incident_type} (+10)")
    else:
        haz_score += 5
        haz_notes.append("Standard scene safety precautions apply (+5)")

    components["hazard_clarity"] = {
        "score": min(15, haz_score),
        "max": 15,
        "details": "; ".join(haz_notes),
        "status": "IDENTIFIED" if haz_score >= 10 else "STANDARD"
    }

    # 5. Contact & Callback Verification (10 pts)
    contact_score = 0
    contact_notes = []
    contact = (reporter_contact or "").strip()
    if contact and contact.upper() not in ["N/A", "NONE", "UNKNOWN", ""]:
        contact_score += 10
        contact_notes.append("Verified reporter callback contact provided (+10)")
    else:
        contact_score += 0
        contact_notes.append("Anonymous / no callback phone provided (0/10)")

    components["contact_availability"] = {
        "score": contact_score,
        "max": 10,
        "details": "; ".join(contact_notes),
        "status": "AVAILABLE" if contact_score > 0 else "ANONYMOUS"
    }

    # 6. Audio / Visual Evidence Manifest (10 pts)
    evid_score = 0
    evid_notes = []
    if has_audio_transcript:
        evid_score += 5
        evid_notes.append("Voice recording / acoustic transcript attached (+5)")
    if has_photo_evidence:
        evid_score += 5
        evid_notes.append("Photographic scene evidence attached (+5)")
    if not has_audio_transcript and not has_photo_evidence:
        evid_notes.append("No multimedia evidence attached (0/10)")

    components["evidence_manifest"] = {
        "score": evid_score,
        "max": 10,
        "details": "; ".join(evid_notes) or "No media attached",
        "status": "ATTACHED" if evid_score > 0 else "TEXT_ONLY"
    }

    total_score = sum(c["score"] for c in components.values())

    # Level classification
    if total_score >= 80:
        level = "HIGH_DISPATCH_READINESS"
        summary = "Comprehensive field data available for rapid resource dispatch."
    elif total_score >= 50:
        level = "MODERATE_DISPATCH_READINESS"
        summary = "Adequate field data for dispatch; additional operator callback recommended."
    else:
        level = "INITIAL_TRIAGE_READINESS"
        summary = "Essential facts present. Immediate unit dispatch feasible; location confirmation pending."

    return {
        "formula_version": FORMULA_VERSION,
        "calculated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "total_score": round(total_score, 1),
        "max_score": 100,
        "readiness_level": level,
        "summary": summary,
        "components": components,
        "operational_disclaimer": "This score indicates operational data completeness for EOC dispatch and does not represent clinical severity or medical validation."
    }
