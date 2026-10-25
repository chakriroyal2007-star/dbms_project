import math
import random
import datetime
from sqlalchemy.orm import Session
from app.models.models import (
    UserAccount, Hospital, Ambulance, Road, EmergencyTeam,
    Resource, HospitalCapacityHistory, AmbulanceLocationHistory,
    AmbulanceStatusHistory, RoadStatusHistory, TeamStatusHistory,
    ResourceHistory, Incident, Patient, ResourceAllocation, HospitalAssignment
)
from app.services.security import get_password_hash

def seed_database(db: Session, force_reset: bool = False):
    """Populates the database with realistic synthetic emergency grid data."""
    existing_users = db.query(UserAccount).first()
    if existing_users and not force_reset:
        return {"status": "already_seeded", "message": "Database already populated."}

    # If force reset, clear in order
    from app.models.models import Organization, ResponderAssignment, IncidentTimelineEvent

    if force_reset:
        db.query(ResponderAssignment).delete()
        db.query(IncidentTimelineEvent).delete()
        db.query(HospitalAssignment).delete()
        db.query(ResourceAllocation).delete()
        db.query(Patient).delete()
        db.query(Incident).delete()
        db.query(ResourceHistory).delete()
        db.query(Resource).delete()
        db.query(TeamStatusHistory).delete()
        db.query(EmergencyTeam).delete()
        db.query(RoadStatusHistory).delete()
        db.query(Road).delete()
        db.query(HospitalCapacityHistory).delete()
        db.query(AmbulanceStatusHistory).delete()
        db.query(AmbulanceLocationHistory).delete()
        db.query(Ambulance).delete()
        db.query(Hospital).delete()
        db.query(UserAccount).delete()
        db.query(Organization).delete()
        db.commit()

    print("Initializing TERA Seed Data...")
    
    # Base timestamp anchors (centered around 12 Sept 2026)
    base_time = datetime.datetime(2026, 9, 12, 19, 30, 0, tzinfo=datetime.timezone.utc)
    t_minus_2h = base_time - datetime.timedelta(hours=2)
    t_minus_1h = base_time - datetime.timedelta(hours=1)
    t_minus_30m = base_time - datetime.timedelta(minutes=30)
    t_minus_15m = base_time - datetime.timedelta(minutes=15)
    t_plus_30m = base_time + datetime.timedelta(minutes=30)

    # 0. Organizations
    if not db.query(Organization).filter(Organization.organization_id == "ORG_SVRR_TRAUMA").first():
        org_hosp = Organization(
            organization_id="ORG_SVRR_TRAUMA",
            name="SVRR Government General & Trauma Center",
            org_type="HOSPITAL",
            contact_email="emergency@svrr.gov.in",
            contact_phone="+91-877-2287777",
            is_active=True
        )
        db.add(org_hosp)

    if not db.query(Organization).filter(Organization.organization_id == "ORG_EMRI_108").first():
        org_ems = Organization(
            organization_id="ORG_EMRI_108",
            name="Andhra Pradesh 108 Emergency Response Service",
            org_type="AMBULANCE_PROVIDER",
            contact_email="dispatch@emri108.org",
            contact_phone="108",
            is_active=True
        )
        db.add(org_ems)
    db.flush()

    # 1. User Accounts (Complete 6-Role Matrix)
    users = [
        UserAccount(
            user_id="USR_ADMIN_01",
            username="admin",
            email="admin@tera.network",
            hashed_password=get_password_hash("admin123"),
            role="ADMINISTRATOR",
            full_name="EOC Chief Commander",
            is_active=True,
            created_at=t_minus_2h
        ),
        UserAccount(
            user_id="USR_OPERATOR_01",
            username="operator",
            email="operator@tera.network",
            hashed_password=get_password_hash("operator123"),
            role="CONTROL_OPERATOR",
            full_name="Senior Triage Dispatcher",
            is_active=True,
            created_at=t_minus_2h
        ),
        UserAccount(
            user_id="USR_HOSPITAL_01",
            username="hospital_coord",
            email="coordinator@svrr.gov.in",
            hashed_password=get_password_hash("hospital123"),
            role="HOSPITAL_COORDINATOR",
            organization_id="HOSP_01",
            full_name="Dr. Priya Sharma (Trauma Lead)",
            is_active=True,
            created_at=t_minus_2h
        ),
        UserAccount(
            user_id="USR_RESPONDER_01",
            username="responder",
            email="responder@emri108.org",
            hashed_password=get_password_hash("responder123"),
            role="FIELD_RESPONDER",
            organization_id="ORG_EMRI_108",
            full_name="Paramedic Lead Rajesh Kumar",
            is_active=True,
            created_at=t_minus_2h
        ),
        UserAccount(
            user_id="USR_ANALYST_01",
            username="analyst",
            email="analyst@tera.network",
            hashed_password=get_password_hash("analyst123"),
            role="ANALYST",
            full_name="Disaster Data Analyst",
            is_active=True,
            created_at=t_minus_2h
        ),
        UserAccount(
            user_id="USR_REPORTER_01",
            username="reporter",
            email="reporter@tera.network",
            hashed_password=get_password_hash("reporter123"),
            role="REPORTER",
            full_name="Citizen Emergency Informant",
            is_active=True,
            created_at=t_minus_2h
        ),
    ]
    db.add_all(users)
    db.flush()

    # 2. Hospitals (100 facilities across simulated metropolitan grid)
    center_lat = 13.6288
    center_lng = 79.4192
    
    hospital_templates = [
        ("SVRR Government Trauma Center", "TRAUMA_CENTER_LEVEL_1", "LEVEL_1", 13.6350, 79.4150, 24, 60),
        ("Sri Venkateswara Institute of Medical Sciences (SVIMS)", "TRAUMA_CENTER_LEVEL_1", "LEVEL_1", 13.6390, 79.4070, 30, 75),
        ("Apollo Emergency Medical Center", "PRIVATE_MULTI_SPECIALTY", "LEVEL_1", 13.6210, 79.4280, 16, 45),
        ("District Headquarters Hospital", "DISTRICT_HOSPITAL", "LEVEL_2", 13.6180, 79.4350, 12, 40),
        ("Amara Trauma & Multi-Specialty", "SPECIALTY_SURGICAL", "LEVEL_2", 13.6450, 79.4300, 10, 30),
        ("Aster CMI Rapid Response Wing", "PRIVATE_MULTI_SPECIALTY", "LEVEL_2", 13.6520, 79.3980, 14, 35),
        ("Metro Apex Critical Care", "TRAUMA_CENTER_LEVEL_2", "LEVEL_2", 13.6050, 79.4120, 8, 25),
        ("South Zone Emergency Hospital", "GOVERNMENT_GENERAL", "LEVEL_3", 13.5900, 79.4400, 6, 20),
        ("Renigunta Corridor Medical Center", "DISTRICT_HOSPITAL", "LEVEL_3", 13.6400, 79.5100, 6, 25),
        ("Chandragiri Community Trauma Unit", "GOVERNMENT_GENERAL", "COMMUNITY", 13.5850, 79.3200, 4, 15)
    ]
    
    hospitals = []
    # Add key landmark hospitals
    for idx, (name, h_type, e_lvl, lat, lng, icu, em_beds) in enumerate(hospital_templates):
        h_id = f"HOSP_{idx+1:03d}"
        hospitals.append(Hospital(
            hospital_id=h_id,
            name=name,
            hospital_type=h_type,
            latitude=lat,
            longitude=lng,
            emergency_level=e_lvl,
            contact_placeholder=f"+91-877-{2200000+idx*100}",
            status="ACTIVE",
            created_at=t_minus_2h
        ))
        
    # Generate remaining up to 100 hospitals
    for i in range(len(hospital_templates) + 1, 101):
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(2.0, 18.0) / 111.0 # degrees
        lat = center_lat + dist * math.cos(angle)
        lng = center_lng + (dist * math.sin(angle)) / math.cos(math.radians(center_lat))
        h_type = random.choice(["GOVERNMENT_GENERAL", "DISTRICT_HOSPITAL", "SPECIALTY_SURGICAL", "PRIVATE_MULTI_SPECIALTY"])
        e_lvl = random.choice(["LEVEL_2", "LEVEL_3", "COMMUNITY"])
        h_id = f"HOSP_{i:03d}"
        hospitals.append(Hospital(
            hospital_id=h_id,
            name=f"Metro Health Center #{i} ({h_type.replace('_', ' ').title()})",
            hospital_type=h_type,
            latitude=round(lat, 6),
            longitude=round(lng, 6),
            emergency_level=e_lvl,
            contact_placeholder=f"+91-877-{2200000+i*7}",
            status="ACTIVE",
            created_at=t_minus_2h
        ))
        
    db.add_all(hospitals)
    db.flush()

    # 3. Hospital Capacity History (Snapshots for 19:00, 19:15, 19:30, 19:45, 20:00)
    capacity_records = []
    resource_records = []
    resource_hist_records = []
    
    for h in hospitals:
        # Base capacities according to emergency level
        if h.emergency_level == "LEVEL_1":
            base_icu, base_em, base_gen = 25, 60, 200
        elif h.emergency_level == "LEVEL_2":
            base_icu, base_em, base_gen = 12, 35, 120
        else:
            base_icu, base_em, base_gen = 5, 18, 60

        # Snapshot 1: 19:00 (Healthy state before major disaster spike)
        capacity_records.append(HospitalCapacityHistory(
            capacity_history_id=f"CAP_{h.hospital_id}_1900",
            hospital_id=h.hospital_id,
            timestamp=base_time - datetime.timedelta(minutes=30),
            icu_total=base_icu,
            icu_available=int(base_icu * 0.65),
            emergency_beds_total=base_em,
            emergency_beds_available=int(base_em * 0.70),
            general_beds_total=base_gen,
            general_beds_available=int(base_gen * 0.80)
        ))
        # Snapshot 2: 19:15 (Incidents starting to consume capacity)
        capacity_records.append(HospitalCapacityHistory(
            capacity_history_id=f"CAP_{h.hospital_id}_1915",
            hospital_id=h.hospital_id,
            timestamp=base_time - datetime.timedelta(minutes=15),
            icu_total=base_icu,
            icu_available=int(base_icu * 0.40),
            emergency_beds_total=base_em,
            emergency_beds_available=int(base_em * 0.45),
            general_beds_total=base_gen,
            general_beds_available=int(base_gen * 0.70)
        ))
        
        # Snapshot 3: 19:30 (THE EXACT DISASTER SCENARIO TARGET STATE: Very tight resources)
        # SVRR (HOSP_001) has 4 ICU, SVIMS (HOSP_002) has 4 ICU, Apollo (HOSP_003) has 3 ICU, etc.
        # Across the city, total available ICU is constrained to ~14 in primary hubs
        if h.hospital_id == "HOSP_001":
            avail_icu, avail_em = 4, 10
        elif h.hospital_id == "HOSP_002":
            avail_icu, avail_em = 4, 12
        elif h.hospital_id == "HOSP_003":
            avail_icu, avail_em = 3, 8
        elif h.hospital_id == "HOSP_004":
            avail_icu, avail_em = 2, 5
        elif h.hospital_id == "HOSP_005":
            avail_icu, avail_em = 1, 2
        else:
            avail_icu = max(0, int(base_icu * random.uniform(0.05, 0.20)))
            avail_em = max(1, int(base_em * random.uniform(0.10, 0.30)))

        capacity_records.append(HospitalCapacityHistory(
            capacity_history_id=f"CAP_{h.hospital_id}_1930",
            hospital_id=h.hospital_id,
            timestamp=base_time,
            icu_total=base_icu,
            icu_available=avail_icu,
            emergency_beds_total=base_em,
            emergency_beds_available=avail_em,
            general_beds_total=base_gen,
            general_beds_available=int(base_gen * 0.50)
        ))

        # Hospital inventory supplies (Blood O-, Ventilators, Oxygen, Surgical kits)
        res_types = [
            ("BLOOD_O_NEG", 40, random.randint(2, 12), 8),
            ("VENTILATOR", 20, random.randint(1, 6), 4),
            ("OXYGEN_CYLINDERS", 100, random.randint(15, 60), 20),
            ("SURGICAL_KIT", 30, random.randint(4, 18), 6)
        ]
        for r_type, total_q, avail_q, thresh in res_types:
            r_id = f"RES_{h.hospital_id}_{r_type}"
            status = "CRITICAL" if avail_q <= (thresh // 2) else ("LOW" if avail_q <= thresh else "ADEQUATE")
            resource_records.append(Resource(
                resource_id=r_id,
                hospital_id=h.hospital_id,
                resource_type=r_type,
                total_quantity=total_q,
                available_quantity=avail_q,
                critical_threshold=thresh,
                status=status
            ))
            resource_hist_records.append(ResourceHistory(
                resource_history_id=f"RH_{r_id}_1930",
                resource_id=r_id,
                timestamp=base_time,
                quantity_available=avail_q,
                change_amount=-(total_q - avail_q),
                change_reason="Emergency dispatch and surgery consumption"
            ))

    db.add_all(capacity_records)
    db.add_all(resource_records)
    db.add_all(resource_hist_records)
    db.flush()

    # 4. Ambulances (500 units)
    ambulances = []
    amb_locations = []
    amb_statuses = []
    
    # We calibrate statuses at 19:30 such that exactly 17 ambulances are AVAILABLE in central sector
    for i in range(1, 501):
        amb_id = f"AMB_{i:03d}"
        reg = f"AP-03-EM-{1000+i}"
        amb_type = "ALS" if i % 3 == 0 else ("BLS" if i % 3 == 1 else "HAZMAT_PARAMEDIC")
        home_h = hospitals[(i - 1) % len(hospitals)]
        
        # 17 ambulances specifically available around center at 19:30
        if i <= 17:
            curr_status = "AVAILABLE"
            lat = center_lat + random.uniform(-0.04, 0.04)
            lng = center_lng + random.uniform(-0.04, 0.04)
            speed = 0.0
        elif i <= 350:
            curr_status = random.choice(["DISPATCHED", "TRANSPORTING"])
            lat = center_lat + random.uniform(-0.12, 0.12)
            lng = center_lng + random.uniform(-0.12, 0.12)
            speed = random.uniform(35.0, 75.0)
        else:
            curr_status = random.choice(["MAINTENANCE", "OFFLINE"])
            lat = home_h.latitude
            lng = home_h.longitude
            speed = 0.0

        ambulances.append(Ambulance(
            ambulance_id=amb_id,
            registration_number=reg,
            ambulance_type=amb_type,
            capacity=2 if amb_type == "ALS" else 1,
            home_hospital_id=home_h.hospital_id,
            current_status=curr_status,
            created_at=t_minus_2h
        ))
        
        # Location history snapshot at 19:30
        amb_locations.append(AmbulanceLocationHistory(
            location_id=f"LOC_{amb_id}_1930",
            ambulance_id=amb_id,
            timestamp=base_time,
            latitude=round(lat, 6),
            longitude=round(lng, 6),
            speed=round(speed, 1),
            status=curr_status
        ))
        
        # Status interval
        amb_statuses.append(AmbulanceStatusHistory(
            status_history_id=f"ASH_{amb_id}_1930",
            ambulance_id=amb_id,
            status=curr_status,
            start_time=t_minus_30m,
            end_time=None,
            reason="Fleet active monitoring log"
        ))

    db.add_all(ambulances)
    db.add_all(amb_locations)
    db.add_all(amb_statuses)
    db.flush()

    # 5. Emergency Teams (60 teams)
    teams = []
    team_statuses = []
    specs = ['TRAUMA_SURGICAL', 'HAZMAT_DECONTAMINATION', 'SEARCH_RESCUE', 'CARDIAC_RESPONSE', 'BURN_DISASTER_CARE', 'PEDIATRIC_TRIAGE']
    for i in range(1, 61):
        t_id = f"TEAM_{i:03d}"
        spec = specs[(i-1) % len(specs)]
        home_h = hospitals[(i - 1) % len(hospitals)]
        status = "AVAILABLE" if i <= 14 else ("DEPLOYED" if i <= 48 else "RESTING")
        teams.append(EmergencyTeam(
            team_id=t_id,
            team_name=f"Alpha Strike Unit {i} ({spec.replace('_', ' ')})",
            specialization=spec,
            capacity=random.randint(4, 8),
            home_hospital_id=home_h.hospital_id,
            status=status
        ))
        team_statuses.append(TeamStatusHistory(
            team_status_id=f"TSH_{t_id}_1930",
            team_id=t_id,
            timestamp=base_time,
            status=status
        ))
    db.add_all(teams)
    db.add_all(team_statuses)
    db.flush()

    # 6. Roads (Simulated network corridor lines with 3 critical blockages)
    roads = []
    road_statuses = []
    
    # 3 explicitly blocked / bottleneck arterial roads for the scenario
    critical_roads = [
        ("ROAD_001", "NH-71 Expressway - Airport Bypass", "Renigunta Junction", "Central Bus Terminal", 14.5, "EXPRESSWAY", 13.645, 79.520, 13.628, 79.420, "SEVERE", 5.0, True),
        ("ROAD_002", "Alipiri Bypass Corridor (R17)", "Alipiri Gate", "SVIMS Trauma Circle", 6.2, "ARTERIAL_HIGHWAY", 13.655, 79.395, 13.639, 79.407, "SEVERE", 0.0, True),
        ("ROAD_003", "Industrial Zone Link Road 4", "Settipalli Industrial Area", "SVRR Hospital Road", 8.8, "PRIMARY_URBAN", 13.610, 79.460, 13.635, 79.415, "SEVERE", 4.0, True)
    ]
    
    for r_id, name, src, dst, dist, r_type, s_lat, s_lng, e_lat, e_lng, traf, spd, blk in critical_roads:
        roads.append(Road(
            road_id=r_id,
            road_name=name,
            source_location=src,
            destination_location=dst,
            distance_km=dist,
            road_type=r_type,
            start_lat=s_lat,
            start_lng=s_lng,
            end_lat=e_lat,
            end_lng=e_lng
        ))
        road_statuses.append(RoadStatusHistory(
            road_status_id=f"RSH_{r_id}_1930",
            road_id=r_id,
            timestamp=base_time,
            traffic_level=traf,
            average_speed=spd,
            blocked=blk
        ))
        
    # Generate 150 additional primary road segments
    for i in range(4, 151):
        r_id = f"ROAD_{i:03d}"
        s_hosp = hospitals[i % len(hospitals)]
        e_hosp = hospitals[(i + 7) % len(hospitals)]
        dist_calc = math.sqrt((s_hosp.latitude - e_hosp.latitude)**2 + (s_hosp.longitude - e_hosp.longitude)**2) * 111.0
        dist = max(1.5, round(dist_calc, 1))
        
        traf = random.choice(["LOW", "MEDIUM", "HIGH"])
        spd = 60.0 if traf == "LOW" else (35.0 if traf == "MEDIUM" else 18.0)
        
        roads.append(Road(
            road_id=r_id,
            road_name=f"Urban Sector {i} Corridor",
            source_location=s_hosp.name,
            destination_location=e_hosp.name,
            distance_km=dist,
            road_type="PRIMARY_URBAN",
            start_lat=s_hosp.latitude,
            start_lng=s_hosp.longitude,
            end_lat=e_hosp.latitude,
            end_lng=e_hosp.longitude
        ))
        road_statuses.append(RoadStatusHistory(
            road_status_id=f"RSH_{r_id}_1930",
            road_id=r_id,
            timestamp=base_time,
            traffic_level=traf,
            average_speed=spd,
            blocked=False
        ))
        
    db.add_all(roads)
    db.add_all(road_statuses)
    db.flush()

    # 7. DISASTER & CITIZEN REPORT SCENARIOS
    # Incidents 1-4: Active Multi-Casualty Incidents
    # Incidents 5-6: Incoming Citizen Reports (RECEIVED) awaiting EOC Verification
    scenario_incidents = [
        (
            "INC_DISASTER_001",
            "ROAD_ACCIDENT",
            "Multi-vehicle pileup on NH-71 Expressway involving intercity bus and chemical tanker",
            "CRITICAL",
            13.6420, 79.4850,
            "NH-71 Expressway Km 14 Near Airport Junction",
            "Airport Corridor",
            "Tirupati Airport Toll Gate",
            t_minus_15m,
            8,
            "ACTIVE"
        ),
        (
            "INC_DISASTER_002",
            "BUILDING_FIRE",
            "Commercial shopping complex 4-story structural fire with toxic smoke entrapment",
            "HIGH",
            13.6260, 79.4210,
            "Town Center Plaza, Gandhi Road",
            "Central Commercial Sector",
            "Gandhi Road Clock Tower",
            t_minus_2h + datetime.timedelta(minutes=45),
            15,
            "ACTIVE"
        ),
        (
            "INC_DISASTER_003",
            "FLOOD",
            "Flash flood causing low-lying residential inundation and roof collapse",
            "HIGH",
            13.6120, 79.4350,
            "Swarnamukhi River Basin Sector 4",
            "Swarnamukhi River Ward",
            "Old Bridge River Bank",
            t_minus_1h,
            20,
            "ACTIVE"
        ),
        (
            "INC_DISASTER_004",
            "INDUSTRIAL_ACCIDENT",
            "Chemical reactor leak and boiler explosion in manufacturing park",
            "CRITICAL",
            13.6050, 79.4680,
            "Renigunta Industrial Estate Block C",
            "Renigunta Tech Cluster",
            "Industrial Estate Phase 2 Gate",
            t_minus_30m,
            6,
            "ACTIVE"
        ),
        (
            "INC_FIELD_1042",
            "ROAD_ACCIDENT",
            "Head-on collision between delivery truck and passenger van near temple bypass circle",
            "HIGH",
            13.6550, 79.3950,
            "Alipiri Bypass Circle Sector 2",
            "Alipiri Corridor",
            "Garuda Statue Circle",
            datetime.datetime.utcnow() - datetime.timedelta(minutes=4),
            5,
            "RECEIVED"
        ),
        (
            "INC_FIELD_1043",
            "HAZMAT",
            "Chemical container leakage with severe vapor spread and respiratory distress",
            "CRITICAL",
            13.6180, 79.4520,
            "Settipalli Freight Yard Shed 3",
            "Settipalli Freight Hub",
            "Railway Cargo Gate 4",
            datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            3,
            "RECEIVED"
        )
    ]
    
    inc_objects = []
    for inc_id, inc_type, desc, sev, lat, lng, loc, locality, landmark, occ_time, p_count, status_code in scenario_incidents:
        inc_objects.append(Incident(
            incident_id=inc_id,
            tracking_code=f"TRK-260912-{inc_id[-4:]}",
            reporter_id="USR_REPORTER_01",
            reporter_name="Citizen Emergency Informant",
            reporter_phone="+91-9876543210",
            reporter_consent=True,
            incident_type=inc_type,
            description=desc,
            severity=sev,
            latitude=lat,
            longitude=lng,
            country="India",
            state="Andhra Pradesh",
            district="Tirupati",
            city="Tirupati",
            locality=locality,
            landmark=landmark,
            location_name=loc,
            occurred_at=occ_time,
            reported_at=occ_time + datetime.timedelta(minutes=1),
            status=status_code,
            estimated_patient_count=p_count,
            created_at=occ_time,
            updated_at=datetime.datetime.utcnow()
        ))
    db.add_all(inc_objects)
    db.flush()

    # Create 49 Patient records matching the 4 incidents
    patients = []
    p_counter = 1
    
    # Incident 1 (8 critical road accident casualties needing ICU/Surgery/Ventilators)
    for _ in range(8):
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_DISASTER_001",
            severity="CRITICAL",
            age=random.randint(18, 65),
            required_resource=random.choice(["ICU_BED", "VENTILATOR", "SURGERY"]),
            transport_status="AWAITING_TRIAGE",
            created_at=t_minus_15m
        ))
        p_counter += 1

    # Incident 2 (15 building fire casualties: burn kits, oxygen, emergency beds)
    for _ in range(15):
        p_sev = random.choice(["CRITICAL", "SERIOUS", "MODERATE"])
        req = "BURN_UNIT" if p_sev == "CRITICAL" else ("OXYGEN" if p_sev == "SERIOUS" else "EMERGENCY_BED")
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_DISASTER_002",
            severity=p_sev,
            age=random.randint(10, 72),
            required_resource=req,
            transport_status="AWAITING_TRIAGE",
            created_at=t_minus_1h
        ))
        p_counter += 1

    # Incident 3 (20 flood casualties: hypothermia, trauma, emergency beds)
    for _ in range(20):
        p_sev = random.choice(["SERIOUS", "MODERATE", "MINOR"])
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_DISASTER_003",
            severity=p_sev,
            age=random.randint(5, 80),
            required_resource="EMERGENCY_BED" if p_sev in ["SERIOUS", "MODERATE"] else "GENERAL_OBSERVATION",
            transport_status="AWAITING_TRIAGE",
            created_at=t_minus_1h
        ))
        p_counter += 1

    # Incident 4 (6 industrial disaster victims: hazmat, ICU, severe inhalation trauma)
    for _ in range(6):
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_DISASTER_004",
            severity="CRITICAL",
            age=random.randint(22, 58),
            required_resource=random.choice(["ICU_BED", "VENTILATOR", "BLOOD_TRANSFUSION"]),
            transport_status="AWAITING_TRIAGE",
            created_at=t_minus_30m
        ))
        p_counter += 1

    # Incident 5 (5 field casualties from highway collision)
    for _ in range(5):
        p_sev = random.choice(["SERIOUS", "CRITICAL", "MODERATE"])
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_FIELD_1042",
            severity=p_sev,
            age=random.randint(19, 60),
            required_resource="ICU_BED" if p_sev == "CRITICAL" else "EMERGENCY_BED",
            transport_status="AWAITING_TRIAGE",
            created_at=datetime.datetime.utcnow()
        ))
        p_counter += 1

    # Incident 6 (3 hazmat vapor victims)
    for _ in range(3):
        patients.append(Patient(
            patient_id=f"PAT_{p_counter:04d}",
            incident_id="INC_FIELD_1043",
            severity="CRITICAL",
            age=random.randint(25, 52),
            required_resource="VENTILATOR",
            transport_status="AWAITING_TRIAGE",
            created_at=datetime.datetime.utcnow()
        ))
        p_counter += 1

    db.add_all(patients)
    db.commit()

    print("TERA Database successfully seeded with 100 hospitals, 500 ambulances, 150+ roads, 60 emergency teams, and 49 disaster patients.")
    return {
        "status": "success",
        "hospitals_seeded": len(hospitals),
        "ambulances_seeded": len(ambulances),
        "roads_seeded": len(roads),
        "teams_seeded": len(teams),
        "patients_seeded": len(patients),
        "incidents_seeded": len(inc_objects)
    }
