import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "TERA - Emergency Assistance & Response Coordination Platform"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"
    
    # Database Settings: Supports PostgreSQL or local SQLite without machine-specific hardcoded paths
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{'/tmp/tera.db' if os.getenv('VERCEL') else str(BASE_DIR / 'tera.db')}"
    )
    
    # JWT & Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tera_production_grade_eoc_master_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # File Storage / Evidence Vault Settings: /tmp on serverless runtime
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "/tmp/uploads" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) else str(BASE_DIR / "uploads")
    )
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_AUDIO_EXTENSIONS: list[str] = [".wav", ".mp3", ".webm", ".m4a", ".ogg"]
    ALLOWED_IMAGE_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    # Grid Center Parameters (Default Region Coordinates)
    SIMULATED_CITY_NAME: str = "Metropolitan Emergency Grid"
    CENTER_LAT: float = 13.6288
    CENTER_LNG: float = 79.4192
    
    # Environment & Data Seeding Guard: strictly disabled in production
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    ALLOW_AUTO_SEED: bool = os.getenv("ALLOW_AUTO_SEED", "false").lower() in ["true", "1", "yes"]
    
    # AI & Speech Provider Configuration
    SPEECH_PROVIDER: str = os.getenv("SPEECH_PROVIDER", "GOOGLE_SPEECH")  # "GOOGLE_SPEECH", "OPENAI_WHISPER", "LOCAL_ENGINE"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()

# Ensure uploads directory exists safely
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except OSError:
    pass

