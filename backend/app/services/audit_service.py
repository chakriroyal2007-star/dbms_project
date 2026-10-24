import datetime
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog, UserAccount

def log_audit_event(
    db: Session,
    action: str,
    entity_name: str,
    entity_id: str,
    user: Optional[UserAccount] = None,
    details: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    old_val: Optional[Dict[str, Any]] = None,
    new_val: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Records an audit trail event in the audit_log table."""
    final_old = old_value if old_value is not None else old_val
    final_new = new_value if new_value is not None else new_val
    
    log = AuditLog(
        log_id=f"LOG_{uuid.uuid4().hex[:12].upper()}",
        user_id=user.user_id if user else None,
        username=user.username if user else "SYSTEM",
        user_role=user.role if user else "SYSTEM",
        action=action.upper(),
        entity_name=entity_name.upper(),
        entity_id=str(entity_id),
        details=details or f"{action.upper()} executed on {entity_name} #{entity_id}",
        old_value_json=final_old,
        new_value_json=final_new,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log)
    db.flush()
    return log
