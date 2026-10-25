import json
import urllib.request
import urllib.error
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status

router = APIRouter(prefix="/geocoding", tags=["Geospatial & Geocoding Services"])

# In-memory LRU-like cache to protect rate limits
_GEOCODE_CACHE: Dict[str, Dict[str, Any]] = {}
_LAST_REQUEST_TIME = 0.0

@router.get("/reverse")
def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
) -> Dict[str, Any]:
    """
    Reverse geocodes coordinates to street addresses using genuine OpenStreetMap Nominatim.
    Strict rules:
    - Never invent street names or landmarks.
    - If provider is unreachable or times out, returns LOOKUP_UNAVAILABLE with exact coordinates retained.
    """
    global _LAST_REQUEST_TIME
    
    # 1. Round to 5 decimal places (~1.1 meter resolution) for caching
    cache_key = f"{lat:.5f},{lng:.5f}"
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    # Rate limiting: Ensure at least 1.0s between outbound queries to Nominatim
    now = time.time()
    elapsed = now - _LAST_REQUEST_TIME
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _LAST_REQUEST_TIME = time.time()

    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "TERA-Emergency-Coordination-Platform/2.1 (contact@tera.network; emergency response)"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=3.5) as response:
            if response.status == 200:
                payload = json.loads(response.read().decode("utf-8"))
                display_name = payload.get("display_name")
                address = payload.get("address", {})
                
                road = address.get("road") or address.get("pedestrian") or address.get("highway")
                suburb = address.get("suburb") or address.get("neighbourhood")
                city = address.get("city") or address.get("town") or address.get("county")
                
                result = {
                    "status": "SUCCESS",
                    "latitude": lat,
                    "longitude": lng,
                    "display_name": display_name,
                    "street": road,
                    "neighbourhood": suburb,
                    "city": city,
                    "provider": "OpenStreetMap Nominatim",
                    "manual_entry_required": False
                }
                _GEOCODE_CACHE[cache_key] = result
                return result
            else:
                return {
                    "status": "LOOKUP_UNAVAILABLE",
                    "latitude": lat,
                    "longitude": lng,
                    "display_name": None,
                    "provider": "OpenStreetMap Nominatim",
                    "manual_entry_required": True,
                    "message": f"Geocoding provider returned status {response.status}. Coordinates preserved."
                }
    except (urllib.error.URLError, TimeoutError, Exception) as e:
        # Gracefully handle network outage, timeout, or rate limit
        return {
            "status": "LOOKUP_UNAVAILABLE",
            "latitude": lat,
            "longitude": lng,
            "display_name": None,
            "provider": "OpenStreetMap Nominatim",
            "manual_entry_required": True,
            "message": f"Geocoding service unavailable ({str(e)}). Coordinates preserved for GPS triage."
        }
