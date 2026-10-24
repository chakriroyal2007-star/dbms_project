import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Road, RoadStatusHistory, EmergencyTeam, TeamStatusHistory, Hospital, UserAccount
from app.schemas.schemas import RoadSegmentResponse, EmergencyTeamResponse, RoadCreate, EmergencyTeamCreate
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(tags=["Roads & Teams"])

@router.get("/roads", response_model=List[RoadSegmentResponse])
def list_roads(blocked_only: bool = False, limit: int = 100, db: Session = Depends(get_db)):
    roads = db.query(Road).limit(limit).all()
    results = []
    
    for r in roads:
        latest_stat = db.query(RoadStatusHistory).filter(
            RoadStatusHistory.road_id == r.road_id
        ).order_by(RoadStatusHistory.timestamp.desc()).first()
        
        is_blocked = latest_stat.blocked if latest_stat else False
        traf = latest_stat.traffic_level if latest_stat else "LOW"
        spd = latest_stat.average_speed if latest_stat else 50.0
        
        if blocked_only and not is_blocked and traf != "SEVERE":
            continue
            
        results.append({
            "road_id": r.road_id,
            "road_name": r.road_name,
            "source_location": r.source_location,
            "destination_location": r.destination_location,
            "distance_km": r.distance_km,
            "road_type": r.road_type,
            "start_lat": r.start_lat,
            "start_lng": r.start_lng,
            "end_lat": r.end_lat,
            "end_lng": r.end_lng,
            "traffic_level": traf,
            "average_speed": spd,
            "blocked": is_blocked
        })
    return results

@router.post("/roads", response_model=RoadSegmentResponse)
def create_road(
    data: RoadCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    road_id = f"ROAD_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_road = Road(
        road_id=road_id,
        road_name=data.road_name,
        source_location=data.source_location,
        destination_location=data.destination_location,
        distance_km=data.distance_km,
        road_type=data.road_type,
        start_lat=data.start_lat,
        start_lng=data.start_lng,
        end_lat=data.end_lat,
        end_lng=data.end_lng
    )
    db.add(new_road)
    
    db.add(RoadStatusHistory(
        road_status_id=f"RSH_{road_id}_INIT",
        road_id=road_id,
        timestamp=datetime.datetime.utcnow(),
        traffic_level="LOW",
        average_speed=50.0,
        blocked=False
    ))
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="road",
        entity_id=road_id,
        user=current_user,
        details=f"Registered road {data.road_name} ({data.source_location} -> {data.destination_location})",
        new_val={"name": data.road_name, "distance_km": data.distance_km}
    )
    
    db.commit()
    db.refresh(new_road)
    
    return {
        "road_id": new_road.road_id,
        "road_name": new_road.road_name,
        "source_location": new_road.source_location,
        "destination_location": new_road.destination_location,
        "distance_km": new_road.distance_km,
        "road_type": new_road.road_type,
        "start_lat": new_road.start_lat,
        "start_lng": new_road.start_lng,
        "end_lat": new_road.end_lat,
        "end_lng": new_road.end_lng,
        "traffic_level": "LOW",
        "average_speed": 50.0,
        "blocked": False
    }

@router.patch("/roads/{road_id}/block")
def toggle_road_blockage(
    road_id: str,
    blocked: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    road = db.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road segment not found")
        
    db.add(RoadStatusHistory(
        road_status_id=f"RSH_{road_id}_{datetime.datetime.utcnow().strftime('%H%M%S')}",
        road_id=road_id,
        timestamp=datetime.datetime.utcnow(),
        traffic_level="SEVERE" if blocked else "LOW",
        average_speed=0.0 if blocked else 50.0,
        blocked=blocked
    ))
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="road",
        entity_id=road_id,
        user=current_user,
        details=f"Road {road.road_name} status updated: blocked={blocked}",
        new_val={"blocked": blocked}
    )
    
    db.commit()
    return {"status": "success", "road_id": road_id, "blocked": blocked}

@router.delete("/roads/{road_id}")
def delete_road(
    road_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR"))
):
    road = db.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road segment not found")
        
    r_name = road.road_name
    db.query(RoadStatusHistory).filter(RoadStatusHistory.road_id == road_id).delete()
    db.delete(road)
    
    log_audit_event(
        db,
        action="DELETE",
        entity_name="road",
        entity_id=road_id,
        user=current_user,
        details=f"Deleted road {r_name}"
    )
    db.commit()
    return {"status": "success", "deleted_road_id": road_id}

@router.get("/teams", response_model=List[EmergencyTeamResponse])
def list_teams(db: Session = Depends(get_db)):
    teams = db.query(EmergencyTeam).all()
    results = []
    for t in teams:
        h = db.query(Hospital).filter(Hospital.hospital_id == t.home_hospital_id).first() if t.home_hospital_id else None
        results.append({
            "team_id": t.team_id,
            "team_name": t.team_name,
            "specialization": t.specialization,
            "capacity": t.capacity,
            "home_hospital_id": t.home_hospital_id,
            "home_hospital_name": h.name if h else None,
            "status": t.status
        })
    return results

@router.post("/teams", response_model=EmergencyTeamResponse)
def create_team(
    data: EmergencyTeamCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    team_id = f"TEAM_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_team = EmergencyTeam(
        team_id=team_id,
        team_name=data.team_name,
        specialization=data.specialization,
        capacity=data.capacity,
        home_hospital_id=data.home_hospital_id,
        status=data.status
    )
    db.add(new_team)
    
    db.add(TeamStatusHistory(
        team_status_history_id=f"TSH_{team_id}_INIT",
        team_id=team_id,
        status=data.status,
        start_time=datetime.datetime.utcnow()
    ))
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="emergency_team",
        entity_id=team_id,
        user=current_user,
        details=f"Created team {data.team_name} ({data.specialization})",
        new_val={"name": data.team_name, "spec": data.specialization}
    )
    
    db.commit()
    db.refresh(new_team)
    
    h = db.query(Hospital).filter(Hospital.hospital_id == new_team.home_hospital_id).first() if new_team.home_hospital_id else None
    return {
        "team_id": new_team.team_id,
        "team_name": new_team.team_name,
        "specialization": new_team.specialization,
        "capacity": new_team.capacity,
        "home_hospital_id": new_team.home_hospital_id,
        "home_hospital_name": h.name if h else None,
        "status": new_team.status
    }

@router.patch("/teams/{team_id}/status")
def update_team_status(
    team_id: str,
    status: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    team = db.query(EmergencyTeam).filter(EmergencyTeam.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Emergency team not found")
        
    old_stat = team.status
    team.status = status
    
    db.add(TeamStatusHistory(
        team_status_history_id=f"TSH_{team_id}_{datetime.datetime.utcnow().strftime('%H%M%S')}",
        team_id=team_id,
        status=status,
        start_time=datetime.datetime.utcnow()
    ))
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="emergency_team",
        entity_id=team_id,
        user=current_user,
        details=f"Team {team.team_name} status changed: {old_stat} -> {status}",
        old_val={"status": old_stat},
        new_val={"status": status}
    )
    
    db.commit()
    return {"status": "success", "team_id": team_id, "new_status": status}
