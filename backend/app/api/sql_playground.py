import time
import re
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.models.models import UserAccount
from app.schemas.schemas import SqlExecuteRequest, SqlExecuteResponse
from app.api.auth import require_role

router = APIRouter(prefix="/sql", tags=["SQL Query Playground"])

DISALLOWED_KEYWORDS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bTRUNCATE\b", r"\bALTER\b",
    r"\bUPDATE\b", r"\bINSERT\b", r"\bGRANT\b", r"\bREVOKE\b",
    r"\bEXEC\b", r"\bEXECUTE\b", r"\bCREATE\b", r"\bREPLACE\b"
]

@router.post("/execute", response_model=SqlExecuteResponse)
def execute_sql_query(
    request: SqlExecuteRequest,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR", "ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Executes raw read-only SQL SELECT queries with performance measurement.
    Restricted to ADMINISTRATOR and ANALYST roles.
    Blocks destructive DDL/DML statements.
    """
    clean_sql = request.sql_query.strip()
    if not clean_sql:
        raise HTTPException(status_code=400, detail="SQL query cannot be empty.")

    # 1. Safety verification: Ensure only read-only statements (SELECT or WITH)
    upper_sql = clean_sql.upper()
    if not (upper_sql.startswith("SELECT") or upper_sql.startswith("WITH") or upper_sql.startswith("EXPLAIN")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Safety Violation: Only SELECT, WITH (CTEs), and EXPLAIN statements are permitted in the query playground."
        )

    for pattern in DISALLOWED_KEYWORDS:
        if re.search(pattern, upper_sql, re.IGNORECASE):
            clean_kw = pattern.replace(r'\b', '')
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Safety Violation: Query contains prohibited keyword '{clean_kw}'."
            )

    # 2. Execute SQL query with timing
    t0 = time.time()
    try:
        res = db.execute(text(clean_sql))
        exec_ms = round((time.time() - t0) * 1000, 2)
        
        # Extract column names and rows
        columns = list(res.keys()) if res.returns_rows else []
        raw_rows = res.fetchmany(100) if res.returns_rows else []  # Cap at 100 rows for UI safety
        
        # Serialize row values
        rows: List[Dict[str, Any]] = []
        for r in raw_rows:
            row_dict = {}
            for k, v in zip(columns, r):
                if hasattr(v, 'isoformat'):
                    row_dict[k] = v.isoformat()
                else:
                    row_dict[k] = v
            rows.append(row_dict)

        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": exec_ms,
            "query_type": "READ_ONLY_SELECT",
            "status": "SUCCESS"
        }
    except Exception as e:
        exec_ms = round((time.time() - t0) * 1000, 2)
        raise HTTPException(
            status_code=400,
            detail=f"Database Query Error ({exec_ms}ms): {str(e)}"
        )
