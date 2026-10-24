import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TERA - Technology-Enabled Relational Architecture"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Database Settings
    # Supports PostgreSQL connection string via DATABASE_URL or defaults to /tmp/tera.db in serverless / local
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{'/tmp' if os.getenv('VERCEL') or not os.path.exists('/Users/rahul/.gemini/antigravity-ide/scratch/tera/backend') else '/Users/rahul/.gemini/antigravity-ide/scratch/tera/backend'}/tera.db"
    )
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tera_super_secret_eoc_master_key_2026_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Grid Center Parameters
    SIMULATED_CITY_NAME: str = "Metropolitan Emergency Grid (Simulated)"
    CENTER_LAT: float = 13.6288
    CENTER_LNG: float = 79.4192

settings = Settings()
