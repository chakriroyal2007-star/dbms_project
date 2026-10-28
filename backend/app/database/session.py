from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Engine configuration with dialect-specific options
engine_kwargs = {
    "pool_pre_ping": True,
}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pooling (sized safely for serverless & containerized runners)
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_timeout"] = 30

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management with auto-close."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
