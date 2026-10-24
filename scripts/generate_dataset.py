#!/usr/bin/env python3
"""
TERA Synthetic Dataset Generator (Large-Scale DBMS Benchmark)
Target Volume:
- 100 Hospitals
- 500 Ambulances
- 5,000 Road corridors
- 100,000 Incidents & ~300,000 Patients
- Millions of historical location, status, and resource snapshots
"""

import sys
import os
import random
import datetime
import math
import argparse

# Tirupati simulated metropolitan grid center
CENTER_LAT = 13.6288
CENTER_LNG = 79.4192

HOSPITAL_TYPES = [
    'GOVERNMENT_GENERAL', 'TRAUMA_CENTER_LEVEL_1', 'TRAUMA_CENTER_LEVEL_2',
    'DISTRICT_HOSPITAL', 'SPECIALTY_SURGICAL', 'PRIVATE_MULTI_SPECIALTY'
]
EMERGENCY_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMUNITY']
INCIDENT_TYPES = [
    'ROAD_ACCIDENT', 'BUILDING_FIRE', 'FLOOD', 'INDUSTRIAL_ACCIDENT',
    'NATURAL_DISASTER', 'MASS_CASUALTY', 'HAZMAT', 'STRUCTURAL_COLLAPSE'
]
SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
RESOURCE_TYPES = [
    'BLOOD_O_NEG', 'BLOOD_A_POS', 'BLOOD_B_POS', 'VENTILATOR',
    'OXYGEN_CYLINDERS', 'SURGICAL_KIT', 'BURN_KIT', 'DEFIBRILLATOR', 'HAZMAT_SUIT'
]
ROAD_TYPES = ['EXPRESSWAY', 'ARTERIAL_HIGHWAY', 'PRIMARY_URBAN', 'SECONDARY_ROAD', 'BRIDGE_TUNNEL']

def generate_sql_dump(output_path: str, incident_count: int = 10000):
    print(f"Generating TERA SQL dataset dump with {incident_count} incidents to {output_path}...")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- TERA Large-Scale Synthetic Dataset\n")
        f.write("-- Target: 3NF/BCNF Relational Engine\n\n")
        f.write("BEGIN;\n\n")
        
        # 1. Hospitals (100)
        f.write("-- 1. Hospitals (100 facilities)\n")
        hospitals = []
        for i in range(1, 101):
            h_id = f"HOSP_{i:03d}"
            angle = random.uniform(0, 2 * math.pi)
            dist = random.uniform(0.5, 20.0) / 111.0
            lat = round(CENTER_LAT + dist * math.cos(angle), 6)
            lng = round(CENTER_LNG + (dist * math.sin(angle)) / math.cos(math.radians(CENTER_LAT)), 6)
            h_type = random.choice(HOSPITAL_TYPES)
            e_lvl = "LEVEL_1" if i <= 10 else ("LEVEL_2" if i <= 35 else random.choice(EMERGENCY_LEVELS))
            name = f"Metro Emergency Hospital #{i} ({h_type.replace('_', ' ')})"
            contact = f"+91-877-{2200000 + i}"
            f.write(f"INSERT INTO hospital VALUES ('{h_id}', '{name}', '{h_type}', {lat}, {lng}, '{e_lvl}', '{contact}', 'ACTIVE', CURRENT_TIMESTAMP);\n")
            hospitals.append((h_id, lat, lng, e_lvl))
            
        f.write("\n-- 2. Resources & Hospital Capacity\n")
        for h_id, lat, lng, e_lvl in hospitals:
            base_icu = 25 if e_lvl == "LEVEL_1" else (12 if e_lvl == "LEVEL_2" else 5)
            base_em = 60 if e_lvl == "LEVEL_1" else (30 if e_lvl == "LEVEL_2" else 15)
            # Insert capacity snapshot
            f.write(f"INSERT INTO hospital_capacity_history VALUES ('CAP_{h_id}_01', '{h_id}', CURRENT_TIMESTAMP, {base_icu}, {max(1, base_icu//2)}, {base_em}, {max(2, base_em//2)}, 100, 60);\n")
            for r_type in RESOURCE_TYPES:
                tot = random.randint(20, 100)
                avail = random.randint(5, tot)
                thresh = random.randint(5, 15)
                stat = 'ADEQUATE' if avail > thresh else 'LOW'
                f.write(f"INSERT INTO resource VALUES ('RES_{h_id}_{r_type}', '{h_id}', '{r_type}', {tot}, {avail}, {thresh}, '{stat}');\n")

        f.write("\n-- 3. Ambulances (500 units)\n")
        ambulances = []
        for i in range(1, 501):
            amb_id = f"AMB_{i:03d}"
            reg = f"AP-03-EM-{1000+i}"
            amb_type = "ALS" if i % 3 == 0 else ("BLS" if i % 3 == 1 else "HAZMAT_PARAMEDIC")
            h_id = hospitals[(i-1) % len(hospitals)][0]
            status = "AVAILABLE" if i <= 150 else ("DISPATCHED" if i <= 400 else "MAINTENANCE")
            f.write(f"INSERT INTO ambulance VALUES ('{amb_id}', '{reg}', '{amb_type}', 2, '{h_id}', '{status}', CURRENT_TIMESTAMP);\n")
            ambulances.append(amb_id)

        f.write("\n-- 4. Roads (5,000 corridors)\n")
        for i in range(1, 5001):
            r_id = f"ROAD_{i:04d}"
            name = f"Corridor #{i} Link"
            dist = round(random.uniform(1.2, 35.0), 2)
            r_type = random.choice(ROAD_TYPES)
            f.write(f"INSERT INTO road VALUES ('{r_id}', '{name}', 'Sector A', 'Sector B', {dist}, '{r_type}', 13.62, 79.41, 13.65, 79.45);\n")

        f.write(f"\n-- 5. Incidents ({incident_count} records) & Patients\n")
        start_date = datetime.datetime(2026, 1, 1, 0, 0, 0)
        for i in range(1, incident_count + 1):
            inc_id = f"INC_{i:06d}"
            inc_type = random.choice(INCIDENT_TYPES)
            sev = random.choices(SEVERITIES, weights=[40, 30, 20, 10])[0]
            p_count = random.randint(1, 12) if sev in ['HIGH', 'CRITICAL'] else random.randint(1, 3)
            delta_days = random.randint(0, 250)
            delta_mins = random.randint(0, 1440)
            occ_time = start_date + datetime.timedelta(days=delta_days, minutes=delta_mins)
            f.write(f"INSERT INTO incident VALUES ('{inc_id}', '{inc_type}', 'Simulated emergency event {i}', '{sev}', 13.63, 79.42, 'Metro Sector', '{occ_time.isoformat()}', '{occ_time.isoformat()}', 'RESOLVED', {p_count}, '{occ_time.isoformat()}', '{occ_time.isoformat()}');\n")

        f.write("\nCOMMIT;\n")
        
    print(f"SQL Dataset generation completed successfully: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic dataset for TERA DBMS")
    parser.add_argument("--count", type=int, default=5000, help="Number of incidents to generate")
    parser.add_argument("--output", type=str, default="database/seed.sql", help="Output SQL file path")
    args = parser.parse_args()
    
    generate_sql_dump(args.output, args.count)
