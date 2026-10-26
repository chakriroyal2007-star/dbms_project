import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import UserAccount, Incident
from app.config import settings

client = TestClient(app)

# ------------------------------------------------------------------------------
# 1. Registration & Role Persistence Tests
# ------------------------------------------------------------------------------
def test_reporter_registration():
    """Valid citizen reporter registration persists role 'REPORTER'."""
    payload = {
        "username": "new_citizen_user",
        "email": "new_citizen@example.com",
        "password": "Password123!",
        "full_name": "Citizen Ramesh",
        "role": "REPORTER"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "REPORTER"
    assert data["username"] == "new_citizen_user"
    assert "access_token" in data

    # Verify directly in database
    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "new_citizen_user").first()
        assert user is not None
        assert user.role == "REPORTER"
        assert user.email == "new_citizen@example.com"


def test_field_responder_registration_not_defaulted_to_reporter():
    """
    CRITICAL REGRESSION TEST for Original Bug:
    When a user registers with role 'FIELD_RESPONDER', they must retain
    role 'FIELD_RESPONDER' and NOT silently default to 'REPORTER'.
    """
    payload = {
        "username": "paramedic_sunil",
        "email": "sunil.paramedic@emri108.org",
        "password": "Password123!",
        "full_name": "Paramedic Sunil Varma",
        "role": "FIELD_RESPONDER"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "FIELD_RESPONDER", f"Expected FIELD_RESPONDER, got {data['role']} (Silent Reporter Default bug!)"
    assert data["username"] == "paramedic_sunil"

    # Verify directly in database
    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "paramedic_sunil").first()
        assert user is not None
        assert user.role == "FIELD_RESPONDER", "Database persisted incorrect role!"


def test_hospital_coordinator_registration():
    """Hospital coordinator registration preserves role 'HOSPITAL_COORDINATOR'."""
    payload = {
        "username": "dr_ananya_coord",
        "email": "ananya@svrr.gov.in",
        "password": "Password123!",
        "full_name": "Dr. Ananya Reddy",
        "role": "HOSPITAL_COORDINATOR"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "HOSPITAL_COORDINATOR"

    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "dr_ananya_coord").first()
        assert user is not None
        assert user.role == "HOSPITAL_COORDINATOR"


def test_operational_analyst_registration():
    """Operational analyst registration preserves role 'ANALYST'."""
    payload = {
        "username": "data_analyst_kiran",
        "email": "kiran.analyst@tera.network",
        "password": "Password123!",
        "full_name": "Kiran Kumar Analyst",
        "role": "ANALYST"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "ANALYST"

    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "data_analyst_kiran").first()
        assert user is not None
        assert user.role == "ANALYST"


def test_privileged_role_self_registration_rejection():
    """
    Public self-registration for privileged role ADMINISTRATOR or CONTROL_OPERATOR
    without valid authorization code must be REJECTED with HTTP 403.
    """
    # 1. Administrator attempt without code
    admin_payload = {
        "username": "unauthorized_admin_attempt",
        "email": "attacker@evil.com",
        "password": "Password123!",
        "full_name": "Fake Administrator",
        "role": "ADMINISTRATOR"
    }
    res_admin = client.post("/api/auth/register", json=admin_payload)
    assert res_admin.status_code == 403
    assert "restricted" in res_admin.json()["detail"].lower()

    # 2. Control Operator attempt without code
    operator_payload = {
        "username": "unauthorized_operator_attempt",
        "email": "fake.op@random.com",
        "password": "Password123!",
        "full_name": "Fake Operator",
        "role": "CONTROL_OPERATOR"
    }
    res_op = client.post("/api/auth/register", json=operator_payload)
    assert res_op.status_code == 403
    assert "restricted" in res_op.json()["detail"].lower()

    # Confirm neither account was created in DB
    with SessionLocal() as db:
        assert db.query(UserAccount).filter(UserAccount.username == "unauthorized_admin_attempt").first() is None
        assert db.query(UserAccount).filter(UserAccount.username == "unauthorized_operator_attempt").first() is None


def test_privileged_role_registration_with_valid_authorization_code():
    """
    When a valid authorization code is provided, registration for privileged roles succeeds.
    """
    code = getattr(settings, "PRIVILEGED_INVITATION_CODE", "TERA-OPERATIONS-SECURE-2026")
    payload = {
        "username": "authorized_new_operator",
        "email": "new.operator@tera.network",
        "password": "Password123!",
        "full_name": "Approved Dispatch Officer",
        "role": "CONTROL_OPERATOR",
        "invitation_code": code
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "CONTROL_OPERATOR"

    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "authorized_new_operator").first()
        assert user is not None
        assert user.role == "CONTROL_OPERATOR"


def test_invalid_role_registration_rejected():
    """An unsupported role string is rejected with HTTP 400 Bad Request."""
    payload = {
        "username": "bad_role_user",
        "email": "badrole@example.com",
        "password": "Password123!",
        "full_name": "Bad Role User",
        "role": "SUPERUSER_ROOT"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "invalid role" in res.json()["detail"].lower()


def test_duplicate_registration_rejected():
    """Duplicate username or email is rejected with HTTP 400 Bad Request."""
    payload = {
        "username": "duplicate_check_user",
        "email": "dupcheck@example.com",
        "password": "Password123!",
        "full_name": "First User",
        "role": "REPORTER"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 200

    # Same username
    dup_uname = payload.copy()
    dup_uname["email"] = "different@example.com"
    res2 = client.post("/api/auth/register", json=dup_uname)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"].lower()

    # Same email
    dup_email = payload.copy()
    dup_email["username"] = "different_user"
    res3 = client.post("/api/auth/register", json=dup_email)
    assert res3.status_code == 400
    assert "already registered" in res3.json()["detail"].lower()


# ------------------------------------------------------------------------------
# 2. Login, Token & Hydration (/api/auth/me) Tests
# ------------------------------------------------------------------------------
def test_all_six_roles_login_and_token_contents():
    """All 6 supported roles authenticate cleanly and receive accurate user details."""
    roles = [
        ("admin", "admin123", "ADMINISTRATOR"),
        ("operator", "operator123", "CONTROL_OPERATOR"),
        ("hospital_coord", "hospital123", "HOSPITAL_COORDINATOR"),
        ("responder", "responder123", "FIELD_RESPONDER"),
        ("analyst", "analyst123", "ANALYST"),
        ("reporter", "reporter123", "REPORTER")
    ]
    for username, pwd, expected_role in roles:
        res = client.post("/api/auth/login", json={"username": username, "password": pwd})
        assert res.status_code == 200, f"Failed login for {username}"
        data = res.json()
        assert data["role"] == expected_role
        assert data["username"] == username
        assert "access_token" in data
        assert data["is_active"] is True


def test_login_invalid_credentials_rejected():
    """Wrong password or unknown username returns HTTP 401."""
    # Wrong password
    res1 = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword!"})
    assert res1.status_code == 401
    assert "incorrect" in res1.json()["detail"].lower()

    # Non-existent user
    res2 = client.post("/api/auth/login", json={"username": "ghost_user", "password": "Password123!"})
    assert res2.status_code == 401


def test_auth_me_hydration_endpoint():
    """
    /api/auth/me returns the authoritative user profile strictly from JWT token,
    preserving the saved role and active status.
    """
    # 1. Hospital Coordinator
    res_login = client.post("/api/auth/login", json={"username": "hospital_coord", "password": "hospital123"})
    token = res_login.json()["access_token"]

    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    profile = res_me.json()
    assert profile["username"] == "hospital_coord"
    assert profile["role"] == "HOSPITAL_COORDINATOR"
    assert profile["is_active"] is True
    assert profile["user_id"] == "USR_HOSPITAL_01"

    # 2. Field Responder
    res_resp = client.post("/api/auth/login", json={"username": "responder", "password": "responder123"})
    resp_token = res_resp.json()["access_token"]
    res_resp_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {resp_token}"})
    assert res_resp_me.status_code == 200
    assert res_resp_me.json()["role"] == "FIELD_RESPONDER"


def test_auth_me_unauthenticated_or_invalid_token():
    """Requests without token or with forged token return HTTP 401."""
    # No header
    res_no_auth = client.get("/api/auth/me")
    assert res_no_auth.status_code == 401

    # Fake token
    res_fake = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.garbage.token"})
    assert res_fake.status_code == 401


def test_deactivated_account_access_blocked():
    """A deactivated account is blocked from login and cannot call protected endpoints."""
    with SessionLocal() as db:
        user = db.query(UserAccount).filter(UserAccount.username == "new_citizen_user").first()
        if user:
            user.is_active = False
            db.commit()

    # Login should return HTTP 403
    res_login = client.post("/api/auth/login", json={"username": "new_citizen_user", "password": "Password123!"})
    assert res_login.status_code == 403
    assert "deactivated" in res_login.json()["detail"].lower()


# ------------------------------------------------------------------------------
# 3. RBAC & Backend Authorization Tests
# ------------------------------------------------------------------------------
def _get_tokens():
    tokens = {}
    creds = {
        "admin": ("admin", "admin123"),
        "operator": ("operator", "operator123"),
        "hospital": ("hospital_coord", "hospital123"),
        "responder": ("responder", "responder123"),
        "analyst": ("analyst", "analyst123"),
        "reporter": ("reporter", "reporter123")
    }
    for key, (u, p) in creds.items():
        res = client.post("/api/auth/login", json={"username": u, "password": p})
        assert res.status_code == 200
        tokens[key] = res.json()["access_token"]
    return tokens


def test_admin_only_endpoints_protection():
    """
    GET /api/auth/users and GET /api/auth/audit-logs are strictly Admin-only.
    All other roles must receive HTTP 403 Forbidden.
    """
    tokens = _get_tokens()

    # Admin CAN access
    res_admin = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['admin']}"})
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)

    # Operator FORBIDDEN
    res_op = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['operator']}"})
    assert res_op.status_code == 403

    # Hospital Coordinator FORBIDDEN
    res_hosp = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['hospital']}"})
    assert res_hosp.status_code == 403

    # Field Responder FORBIDDEN
    res_resp = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['responder']}"})
    assert res_resp.status_code == 403

    # Analyst FORBIDDEN
    res_an = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['analyst']}"})
    assert res_an.status_code == 403

    # Reporter FORBIDDEN
    res_rep = client.get("/api/auth/users", headers={"Authorization": f"Bearer {tokens['reporter']}"})
    assert res_rep.status_code == 403

    # Unauthenticated UNAUTHORIZED
    res_anon = client.get("/api/auth/users")
    assert res_anon.status_code == 401


def test_field_responder_endpoint_protection():
    """
    GET /api/coordination/responder/assignments is restricted to FIELD_RESPONDER,
    CONTROL_OPERATOR, and ADMINISTRATOR.
    Reporters and Analysts receive HTTP 403.
    """
    tokens = _get_tokens()

    # Field Responder CAN access
    res_resp = client.get("/api/coordination/responder/assignments", headers={"Authorization": f"Bearer {tokens['responder']}"})
    assert res_resp.status_code == 200

    # Control Operator CAN access
    res_op = client.get("/api/coordination/responder/assignments", headers={"Authorization": f"Bearer {tokens['operator']}"})
    assert res_op.status_code == 200

    # Analyst FORBIDDEN
    res_an = client.get("/api/coordination/responder/assignments", headers={"Authorization": f"Bearer {tokens['analyst']}"})
    assert res_an.status_code == 403

    # Reporter FORBIDDEN
    res_rep = client.get("/api/coordination/responder/assignments", headers={"Authorization": f"Bearer {tokens['reporter']}"})
    assert res_rep.status_code == 403


def test_hospital_coordinator_endpoint_protection():
    """
    GET /api/coordination/hospital/profile is restricted to HOSPITAL_COORDINATOR,
    CONTROL_OPERATOR, and ADMINISTRATOR.
    Reporters and Analysts receive HTTP 403.
    """
    tokens = _get_tokens()

    # Hospital Coordinator CAN access
    res_hosp = client.get("/api/coordination/hospital/profile", headers={"Authorization": f"Bearer {tokens['hospital']}"})
    assert res_hosp.status_code == 200

    # Analyst FORBIDDEN
    res_an = client.get("/api/coordination/hospital/profile", headers={"Authorization": f"Bearer {tokens['analyst']}"})
    assert res_an.status_code == 403

    # Reporter FORBIDDEN
    res_rep = client.get("/api/coordination/hospital/profile", headers={"Authorization": f"Bearer {tokens['reporter']}"})
    assert res_rep.status_code == 403


def test_analyst_sql_endpoint_protection():
    """
    POST /api/sql/execute is allowed for Analyst and Admin;
    Reporters receive HTTP 403.
    """
    tokens = _get_tokens()

    # Analyst CAN access
    res_an = client.post(
        "/api/sql/execute",
        json={"sql_query": "SELECT count(*) FROM incident;"},
        headers={"Authorization": f"Bearer {tokens['analyst']}"}
    )
    assert res_an.status_code == 200

    # Reporter FORBIDDEN
    res_rep = client.post(
        "/api/sql/execute",
        json={"sql_query": "SELECT count(*) FROM incident;"},
        headers={"Authorization": f"Bearer {tokens['reporter']}"}
    )
    assert res_rep.status_code == 403


def test_guest_emergency_reporting_and_public_tracking_remain_open():
    """
    Guest Emergency Reporting does NOT require authentication.
    Public Tracking by 8-character reference code does NOT require authentication.
    """
    # 1. Anonymous citizen SOS submission
    payload = {
        "incident_type": "TRAUMA_INJURY",
        "description": "Pedestrian injured near circle",
        "severity": "HIGH",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "location_name": "Tirupati Bus Stand Circle",
        "estimated_patient_count": 1
    }
    res_report = client.post("/api/incidents/report", json=payload)
    assert res_report.status_code == 200
    receipt = res_report.json()
    assert receipt["status"] == "RECEIVED"
    code = receipt["tracking_code"]
    assert code.startswith("TRK-")

    # 2. Anonymous tracking by code
    res_track = client.get(f"/api/incidents/track/{code}")
    assert res_track.status_code == 200
    assert res_track.json()["tracking_code"] == code
    assert res_track.json()["incident_type"] == "TRAUMA_INJURY"
