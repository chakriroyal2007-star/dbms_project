import hashlib

def get_password_hash(password: str) -> str:
    """Fast SHA-256 password hash for secure authentication."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain text password against stored hash."""
    return hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password
