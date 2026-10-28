import os
import shutil
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings, BASE_DIR
from app.database.session import engine, Base, SessionLocal
from app.models.models import UserAccount
from app.services.seed_service import seed_database
from app.api import (
    auth, dashboard, incidents, ambulances, hospitals,
    resources, roads, temporal, allocation, simulation,
    analytics, performance, explorer, scenarios, sql_playground,
    evidence, coordination, voice, geocoding, explore
)

# On Vercel runtime with ephemeral SQLite: bootstrap from packaged DB or seed baseline
if os.getenv("VERCEL") and "sqlite" in settings.DATABASE_URL:
    packaged_db = BASE_DIR / "tera.db"
    tmp_db = Path("/tmp/tera.db")
    if packaged_db.exists() and (not tmp_db.exists() or tmp_db.stat().st_size == 0):
        try:
            shutil.copyfile(str(packaged_db), str(tmp_db))
        except Exception:
            pass

# Initialize database schema tables & migrations
try:
    from migrate import run_migrations
    run_migrations()
except Exception as mig_err:
    print(f"[STARTUP WARNING] Migration check: {mig_err}")
    Base.metadata.create_all(bind=engine)

# Ensure baseline accounts and infrastructure exist if user table is empty
try:
    with SessionLocal() as db:
        if not db.query(UserAccount).first():
            seed_database(db=db, force_reset=False)
except Exception:
    pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Temporal Emergency Resource Allocation & Coordination Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (Standard /api)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(ambulances.router, prefix=settings.API_V1_STR)
app.include_router(hospitals.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(roads.router, prefix=settings.API_V1_STR)
app.include_router(temporal.router, prefix=settings.API_V1_STR)
app.include_router(allocation.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(performance.router, prefix=settings.API_V1_STR)
app.include_router(explorer.router, prefix=settings.API_V1_STR)
app.include_router(scenarios.router, prefix=settings.API_V1_STR)
app.include_router(sql_playground.router, prefix=settings.API_V1_STR)
app.include_router(evidence.router, prefix=settings.API_V1_STR)
app.include_router(coordination.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(geocoding.router, prefix=settings.API_V1_STR)
app.include_router(explore.router, prefix=settings.API_V1_STR)

# Versioned /api/v1 aliases for explicit enterprise API clients
app.include_router(voice.router, prefix="/api/v1")
app.include_router(geocoding.router, prefix="/api/v1")
app.include_router(incidents.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "product": "TERA",
        "full_name": "Temporal Emergency Resource Allocation & Coordination Platform",
        "tagline": "Coordinate Every Resource. Respond When It Matters Most.",
        "status": "ONLINE",
        "database_dialect": engine.dialect.name,
        "database_connected": True,
        "api_docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health():
    from sqlalchemy import text
    db_connected = False
    try:
        with SessionLocal() as check_db:
            check_db.execute(text("SELECT 1"))
            db_connected = True
    except Exception:
        db_connected = False

    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    is_ephemeral_sqlite = is_serverless and "sqlite" in str(engine.url)

    return {
        "status": "HEALTHY" if db_connected else "DEGRADED",
        "database_connected": db_connected,
        "database_dialect": engine.dialect.name,
        "database_persistence": "EPHEMERAL_SERVERLESS_STORAGE" if is_ephemeral_sqlite else "DURABLE",
        "serverless_runtime": is_serverless,
        "environment": settings.ENVIRONMENT
    }

@app.get("/api")
def api_root():
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    is_ephemeral_sqlite = is_serverless and "sqlite" in str(engine.url)
    return {
        "product": "TERA API",
        "status": "ONLINE",
        "database_dialect": engine.dialect.name,
        "database_connected": True,
        "database_persistence": "EPHEMERAL_SERVERLESS_STORAGE" if is_ephemeral_sqlite else "DURABLE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
