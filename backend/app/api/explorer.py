from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db

from app.models.models import UserAccount
from app.api.auth import require_role

router = APIRouter(prefix="/explorer", tags=["Database Explorer"])

VALID_TABLES = [
    "user_account", "incident", "patient", "ambulance",
    "ambulance_location_history", "ambulance_status_history",
    "hospital", "hospital_capacity_history", "resource",
    "resource_history", "road", "road_status_history",
    "emergency_team", "team_status_history", "resource_allocation",
    "hospital_assignment", "simulation_scenario", "simulation_result"
]

@router.get("/tables")
def list_tables(
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR", "CONTROL_OPERATOR", "ANALYST"]))
):
    return {"tables": VALID_TABLES}

@router.get("/table/{table_name}")
def get_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR", "CONTROL_OPERATOR", "ANALYST"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    if table_name not in VALID_TABLES:
        raise HTTPException(status_code=400, detail=f"Invalid table name: {table_name}")
        
    # Get total count
    count_sql = text(f"SELECT COUNT(*) FROM {table_name}")
    total_count = db.execute(count_sql).scalar()
    
    # Fetch rows
    query_sql = text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset")
    res = db.execute(query_sql, {"limit": limit, "offset": offset})
    
    columns = list(res.keys())
    rows = [dict(zip(columns, row)) for row in res.fetchall()]
    
    # Convert dates/floats to JSON safe formats
    safe_rows = []
    for r in rows:
        clean_row = {}
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                clean_row[k] = v.isoformat()
            else:
                clean_row[k] = v
        safe_rows.append(clean_row)
        
    return {
        "table_name": table_name,
        "total_records": total_count,
        "limit": limit,
        "offset": offset,
        "columns": columns,
        "rows": safe_rows
    }
