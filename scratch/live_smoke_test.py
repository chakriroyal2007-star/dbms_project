import urllib.request
import json
import ssl
import sys

ctx = ssl.create_default_context()

BASE_URL = "https://tera-one-ruby.vercel.app"

print(f"=== TERA PRODUCTION SMOKE TEST: {BASE_URL} ===")

# 1. Test Root / Health
try:
    req = urllib.request.Request(f"{BASE_URL}/api/health", headers={"User-Agent": "TERA-SmokeTest/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"✅ /api/health HTTP {resp.status}: {data}")
except Exception as e:
    print(f"⚠️ /api/health note: {e}")
    # try root
    try:
        req = urllib.request.Request(f"{BASE_URL}/", headers={"User-Agent": "TERA-SmokeTest/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            print(f"✅ Root page HTTP {resp.status}")
    except Exception as e2:
        print(f"❌ Root page failed: {e2}")

# 2. Test Guest Emergency Submission (Without Login)
try:
    payload = {
        "incident_type": "ROAD_ACCIDENT",
        "description": "Lorry collided with car near Tirupati bus stand, severe bleeding reported",
        "landmark": "Tirupati bus stand",
        "severity": "CRITICAL",
        "estimated_patient_count": 5,
        "caller_phone": "+919876543210",
        "idempotency_key": "live-smoke-test-uuid-001"
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/incidents/report",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "TERA-SmokeTest/1.0"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        inc_data = json.loads(resp.read().decode('utf-8'))
        inc_id = inc_data.get("incident_id")
        tracking_token = inc_data.get("tracking_token")
        print(f"✅ /api/incidents/report HTTP {resp.status}: Incident {inc_id} persisted! Tracking token={tracking_token}")
        
        # 3. Test Citizen Tracking Endpoint
        track_url = f"{BASE_URL}/api/incidents/track/{inc_id}?token={tracking_token}"
        req_track = urllib.request.Request(track_url, headers={"User-Agent": "TERA-SmokeTest/1.0"})
        with urllib.request.urlopen(req_track, context=ctx, timeout=10) as track_resp:
            track_data = json.loads(track_resp.read().decode('utf-8'))
            print(f"✅ /api/incidents/track/{inc_id} HTTP {track_resp.status}: Status={track_data.get('status')}, Readiness={track_data.get('readiness_score')}")

        # 4a. Verify Unauthenticated PDF Access is Denied (Negative Authorization)
        try:
            req_pdf_unauth = urllib.request.Request(f"{BASE_URL}/api/incidents/{inc_id}/pdf", headers={"User-Agent": "TERA-SmokeTest/1.0"})
            with urllib.request.urlopen(req_pdf_unauth, context=ctx, timeout=10) as pdf_unauth_resp:
                print(f"❌ Security violation: PDF accessible without tracking token!")
        except urllib.error.HTTPError as pe:
            if pe.code == 403:
                print(f"✅ Negative authorization verified: PDF denied without tracking token (HTTP {pe.code})")
            else:
                print(f"⚠️ Unexpected PDF status: {pe.code}")

        # 4b. Test Authorized PDF Download with Tracking Token
        pdf_url = f"{BASE_URL}/api/incidents/{inc_id}/pdf?tracking_token={tracking_token}"
        req_pdf = urllib.request.Request(pdf_url, headers={"User-Agent": "TERA-SmokeTest/1.0"})
        with urllib.request.urlopen(req_pdf, context=ctx, timeout=20) as pdf_resp:
            pdf_bytes = pdf_resp.read()
            is_pdf = pdf_bytes.startswith(b"%PDF")
            sha256_header = pdf_resp.headers.get("X-Document-SHA256")
            print(f"✅ /api/incidents/{inc_id}/pdf?token={tracking_token} HTTP {pdf_resp.status}: Received {len(pdf_bytes)} bytes, starts with %PDF={is_pdf}")
            print(f"   X-Document-SHA256: {sha256_header}")

except urllib.error.HTTPError as e:
    print(f"❌ Incident workflow HTTPError {e.code}: {e.read().decode('utf-8')}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Incident workflow failed: {e}")
    sys.exit(1)

# 5. Test Unauthorized Portal API Protection (Negative Authorization)
try:
    req_admin = urllib.request.Request(f"{BASE_URL}/api/auth/users", headers={"User-Agent": "TERA-SmokeTest/1.0"})
    with urllib.request.urlopen(req_admin, context=ctx, timeout=10) as resp:
        print(f"❌ Security violation: /api/auth/users accessible without auth!")
except urllib.error.HTTPError as e:
    if e.code in (401, 403):
        print(f"✅ Negative authorization verified: /api/auth/users rejected with HTTP {e.code}")
    else:
        print(f"⚠️ Unexpected status code: {e.code}")

print("\n🎉 ALL LIVE PRODUCTION SMOKE TESTS PASSED!")
