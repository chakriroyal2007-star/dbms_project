import os
import sys
from pathlib import Path

# Ensure backend root is on python path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Use isolated test database to protect production tera.db from test mutations
TEST_DB_PATH = BACKEND_DIR / "test_tera.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["ENVIRONMENT"] = "testing"

import pytest
from app.database.session import engine, Base, SessionLocal
from app.services.seed_service import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Initializes schema and infrastructure in isolated test database."""
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db=db, force_reset=True, seed_demo_incidents=False)
    yield
    # Clean up test database after test session
    try:
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
    except OSError:
        pass
