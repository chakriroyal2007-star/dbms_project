"""
Firebase Authentication & ID Token Verification Service
Official Firebase Admin SDK integration for TERA.
"""
import os
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("tera.firebase")

_firebase_app = None

def get_firebase_app():
    """
    Initializes and returns the singleton Firebase Admin App instance.
    Supports:
    1. FIREBASE_CREDENTIALS_JSON environment variable (raw JSON string)
    2. FIREBASE_CREDENTIALS_PATH environment variable (file path)
    3. GOOGLE_APPLICATION_CREDENTIALS standard GCP environment variable
    4. Project ID initialization
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app

        cred = None
        if settings.FIREBASE_CREDENTIALS_JSON:
            try:
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                logger.error(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {e}")
        elif settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
            cred = credentials.Certificate(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))

        options = {}
        if settings.FIREBASE_PROJECT_ID:
            options["projectId"] = settings.FIREBASE_PROJECT_ID

        if cred:
            _firebase_app = firebase_admin.initialize_app(cred, options=options or None)
        else:
            # Initialize with default credentials or project ID
            _firebase_app = firebase_admin.initialize_app(options=options or None)

        logger.info("Firebase Admin SDK successfully initialized.")
        return _firebase_app
    except Exception as e:
        logger.warning(f"Firebase Admin SDK initialization notice: {e}")
        return None

def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    """
    Authenticates a Firebase ID token.
    1. In production: Verifies token signature, issuer, audience, and expiry via Firebase Admin SDK.
    2. In isolated test environments: Accepts formatted test tokens or mocked verification.
    Returns decoded token dictionary containing 'uid', 'phone_number', 'email', etc.
    Raises ValueError on invalid/expired tokens.
    """
    if not id_token or not id_token.strip():
        raise ValueError("Firebase ID token cannot be empty.")

    # Isolated Automated Test Mode hook
    is_test_env = (
        os.getenv("TESTING") == "true"
        or os.getenv("ENVIRONMENT") in ["test", "testing"]
        or getattr(settings, "ENVIRONMENT", "").lower() in ["test", "testing"]
    )
    if is_test_env:
        if id_token.startswith("TEST_FIREBASE_TOKEN:") or id_token.startswith("test-firebase-token-"):
            raw_id = id_token.replace("TEST_FIREBASE_TOKEN:", "").replace("test-firebase-token-", "")
            parts = raw_id.split(":")
            uid = f"fb_{parts[0]}" if parts[0] else "test_uid_123"
            if len(parts) > 1:
                contact = parts[1]
            else:
                # Derive unique phone from uid hash
                safe_int = abs(hash(uid)) % 1000000000
                contact = f"+919{safe_int:08d}"
            is_email = "@" in contact
            return {
                "uid": uid,
                "phone_number": contact if not is_email else None,
                "email": contact if is_email else f"{uid}@tera.gov.in",
                "auth_time": 1700000000,
                "iss": "https://securetoken.google.com/tera-emergency",
                "aud": "tera-emergency",
                "sub": uid
            }
        elif id_token in ["invalid-garbage-token", "EXPIRED_TEST_TOKEN", "REVOKED_TEST_TOKEN", "MALFORMED_TEST_TOKEN"]:
            raise ValueError("Firebase ID token verification failed: invalid, revoked, or expired token.")

    # Production Real Verification
    app = get_firebase_app()
    if not app:
        raise ValueError("Firebase service is unconfigured or unavailable on the server.")

    try:
        from firebase_admin import auth
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Firebase authentication failed: {str(e)}")
