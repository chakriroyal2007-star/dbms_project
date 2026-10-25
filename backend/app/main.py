from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.seed_service import seed_database
from app.api import (
    auth, dashboard, incidents, ambulances, hospitals,
    resources, roads, temporal, allocation, simulation,
    analytics, performance, explorer, scenarios, sql_playground,
    evidence, coordination
)

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

# Auto seed if empty
with SessionLocal() as db:
    seed_database(db=db, force_reset=False)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Temporal Emergency Resource Allocation & Coordination DBMS Engine",
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

# Include Routers
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

@app.get("/")
def root():
    return {
        "product": "TERA",
        "full_name": "Temporal Emergency Resource Allocation & Coordination System",
        "tagline": "Coordinate Every Resource. Respond When It Matters Most.",
        "status": "ONLINE",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
