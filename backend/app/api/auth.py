import datetime
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.models.models import UserAccount, AuditLog
from app.schemas.schemas import (
    Token, UserLogin, UserCreate, UserUpdate, UserResponse, AuditLogResponse
)
from app.services.security import verify_password, get_password_hash
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

VALID_ROLES = {
    "REPORTER",
    "CONTROL_OPERATOR",
    "HOSPITAL_COORDINATOR",
    "FIELD_RESPONDER",
    "ANALYST",
    "ADMINISTRATOR",
    "ADMIN"
}
PRIVILEGED_ROLES = {"ADMINISTRATOR", "ADMIN", "CONTROL_OPERATOR"}
PUBLIC_ROLES = {"REPORTER", "FIELD_RESPONDER", "HOSPITAL_COORDINATOR", "ANALYST"}

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[UserAccount]:
    """Retrieves authenticated user strictly from JWT token."""
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
        
    user = db.query(UserAccount).filter(UserAccount.username == username).first()
    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Contact an Administrator."
            )
        return user
    return None

def require_role(*allowed_roles):
    """Strict backend dependency enforcing RBAC role checks."""
    # Flatten if passed as list/tuple or individual strings
    flattened_roles = []
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            flattened_roles.extend([str(x).upper() for x in r])
        else:
            flattened_roles.append(str(r).upper())
            
    def role_checker(current_user: Optional[UserAccount] = Depends(get_current_user)):
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials required"
            )
        # Normalize role string
        user_role = current_user.role.upper()
        
        # Allow ADMINISTRATOR or ADMIN
        if ("ADMINISTRATOR" in flattened_roles or "ADMIN" in flattened_roles) and user_role in ["ADMIN", "ADMINISTRATOR"]:
            return current_user
            
        if user_role not in flattened_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {flattened_roles}, but user has role '{current_user.role}'."
            )
        return current_user
    return role_checker

# ------------------------------------------------------------------------------
# Auth Endpoints
# ------------------------------------------------------------------------------
@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Match by username or email
    user = db.query(UserAccount).filter(
        (UserAccount.username == login_data.username) | 
        (UserAccount.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an Administrator."
        )

    user.last_login_at = datetime.datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.user_id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "user_id": user.user_id,
        "organization_id": user.organization_id,
        "is_active": user.is_active
    }

@router.post("/token", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(
        (UserAccount.username == form_data.username) |
        (UserAccount.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated.")
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.user_id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "user_id": user.user_id,
        "organization_id": user.organization_id,
        "is_active": user.is_active
    }

@router.post("/register", response_model=Token)
def register_account(data: UserCreate, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    - Validates requested role against supported role list.
    - Public self-registration allows: REPORTER, FIELD_RESPONDER, HOSPITAL_COORDINATOR, ANALYST.
    - Privileged operational roles (ADMINISTRATOR, CONTROL_OPERATOR) require administrative authorization.
    """
    raw_role = (data.role or "REPORTER").strip().upper()
    if raw_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{data.role}'. Supported roles: {', '.join(sorted(list(VALID_ROLES - {'ADMIN'})))}"
        )

    requested_role = "ADMINISTRATOR" if raw_role == "ADMIN" else raw_role

    # Privileged roles require valid administrative authorization code
    if requested_role in PRIVILEGED_ROLES:
        provided_code = (data.invitation_code or "").strip()
        expected_code = getattr(settings, "PRIVILEGED_INVITATION_CODE", "TERA-OPERATIONS-SECURE-2026")
        if not provided_code or provided_code != expected_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Self-registration for privileged role '{requested_role}' is restricted. Administrator provisioning or a valid administrative authorization code is required."
            )

    existing = db.query(UserAccount).filter(
        (UserAccount.username == data.username.strip()) | (UserAccount.email == data.email.strip().lower())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    new_id = f"USR_{uuid.uuid4().hex[:8].upper()}"
    new_user = UserAccount(
        user_id=new_id,
        username=data.username.strip(),
        email=data.email.strip().lower(),
        hashed_password=get_password_hash(data.password),
        role=requested_role,
        full_name=data.full_name.strip(),
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.username, "role": new_user.role, "user_id": new_user.user_id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "user_id": new_user.user_id,
        "organization_id": new_user.organization_id,
        "is_active": new_user.is_active
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: Optional[UserAccount] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

# ------------------------------------------------------------------------------
# Administrator User Management CRUD Endpoints
# ------------------------------------------------------------------------------
@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Lists all registered system users."""
    return db.query(UserAccount).order_by(UserAccount.created_at.desc()).all()

@router.post("/users", response_model=UserResponse)
def create_user(
    data: UserCreate,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Registers a new user with assigned role."""
    raw_role = (data.role or "CONTROL_OPERATOR").strip().upper()
    if raw_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{data.role}'. Supported roles: {', '.join(sorted(list(VALID_ROLES - {'ADMIN'})))}"
        )
    target_role = "ADMINISTRATOR" if raw_role == "ADMIN" else raw_role

    existing = db.query(UserAccount).filter(
        (UserAccount.username == data.username) | (UserAccount.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_id = f"USR_{uuid.uuid4().hex[:8].upper()}"
    new_user = UserAccount(
        user_id=new_id,
        username=data.username.strip(),
        email=data.email.strip().lower(),
        hashed_password=get_password_hash(data.password),
        role=target_role,
        full_name=data.full_name.strip(),
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    
    log_audit_event(
        db=db,
        action="CREATE",
        entity_name="USER",
        entity_id=new_id,
        user=current_user,
        details=f"Admin created user {data.username} with role {target_role}"
    )
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Modifies user details, status, or role."""
    target_user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_val = {"role": target_user.role, "is_active": target_user.is_active, "full_name": target_user.full_name}
    
    if data.email is not None:
        target_user.email = data.email.strip().lower()
    if data.role is not None:
        raw_role = data.role.strip().upper()
        if raw_role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{data.role}'. Supported roles: {', '.join(sorted(list(VALID_ROLES - {'ADMIN'})))}"
            )
        target_user.role = "ADMINISTRATOR" if raw_role == "ADMIN" else raw_role
    if data.full_name is not None:
        target_user.full_name = data.full_name.strip()
    if data.is_active is not None:
        target_user.is_active = data.is_active
    if data.password:
        target_user.hashed_password = get_password_hash(data.password)

    new_val = {"role": target_user.role, "is_active": target_user.is_active, "full_name": target_user.full_name}
    
    log_audit_event(
        db=db,
        action="UPDATE",
        entity_name="USER",
        entity_id=user_id,
        user=current_user,
        old_value=old_val,
        new_value=new_val,
        details=f"Admin modified user {target_user.username}"
    )
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Deactivates or removes a user."""
    target_user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    log_audit_event(
        db=db,
        action="DELETE",
        entity_name="USER",
        entity_id=user_id,
        user=current_user,
        details=f"Admin removed user account {target_user.username}"
    )
    db.delete(target_user)
    db.commit()
    return {"status": "success", "message": f"User {user_id} removed"}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    entity_name: Optional[str] = None,
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Retrieves system audit trail logs."""
    query = db.query(AuditLog)
    if entity_name:
        query = query.filter(AuditLog.entity_name == entity_name.upper())
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.post("/reset-demo")
def reset_demo_environment(
    current_user: UserAccount = Depends(require_role(["ADMIN", "ADMINISTRATOR"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Safely resets operational data to the clean demo baseline."""
    from app.services.seed_service import seed_database
    res = seed_database(db=db, force_reset=True)
    log_audit_event(
        db=db,
        action="RESET",
        entity_name="SYSTEM",
        entity_id="DATABASE",
        user=current_user,
        details="Admin reset demo database environment to baseline state."
    )
    db.commit()
    return {"status": "success", "message": "Demo environment reset to clean baseline."}
