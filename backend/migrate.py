#!/usr/bin/env python3
"""
TERA Dialect-Agnostic Database Migration Script
Applies safe, non-destructive schema migrations and audits user accounts across
both PostgreSQL and SQLite databases.
"""
import sys
import os
from pathlib import Path
from sqlalchemy import inspect, text

# Add backend directory to path if running directly
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.session import engine, Base
from app.models.models import *  # Ensure all models are registered in Base.metadata

def run_migrations():
    print(f"[MIGRATION] Connecting to database dialect '{engine.dialect.name}'...")
    
    # 1. Create any tables defined in metadata that do not exist yet (e.g. transcription_job)
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] Base table schemas verified / created.")

    # 2. Inspect existing columns and add missing ones
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    columns_to_ensure = [
        # Table, Column, Column Definition (Dialect-safe)
        ("user_account", "organization_id", "VARCHAR(64)"),
        ("user_account", "phone_number", "VARCHAR(32)"),
        ("user_account", "firebase_uid", "VARCHAR(128)"),
        ("user_account", "approval_status", "VARCHAR(32) DEFAULT 'APPROVED'"),
        ("user_account", "approval_notes", "TEXT"),
        ("user_account", "approved_by_user_id", "VARCHAR(64)"),
        ("user_account", "approved_at", "TIMESTAMP"),

        ("incident", "tracking_code", "VARCHAR(32)"),
        ("incident", "tracking_token", "VARCHAR(64)"),
        ("incident", "reporter_name", "VARCHAR(150)"),
        ("incident", "reporter_phone", "VARCHAR(32)"),
        ("incident", "reporter_consent", "BOOLEAN DEFAULT TRUE"),
        ("incident", "voice_transcript", "TEXT"),
        ("incident", "detected_language", "VARCHAR(32)"),
        ("incident", "structured_extraction_json", "JSON" if engine.dialect.name == "postgresql" else "TEXT"),
        ("incident", "location_accuracy_meters", "FLOAT"),
        ("incident", "is_location_verified", "BOOLEAN DEFAULT FALSE"),
        ("incident", "evidence_urls_json", "JSON" if engine.dialect.name == "postgresql" else "TEXT"),
        ("incident", "timeline_events_json", "JSON" if engine.dialect.name == "postgresql" else "TEXT"),
        ("incident", "linked_duplicate_id", "VARCHAR(64)"),
        ("incident", "resolution_notes", "TEXT"),
        ("incident", "idempotency_key", "VARCHAR(128)"),
        ("incident", "readiness_score", "FLOAT"),
        ("incident", "readiness_details_json", "JSON" if engine.dialect.name == "postgresql" else "TEXT"),
        ("incident", "hazards_reported", "TEXT"),
        ("incident", "injuries_reported", "TEXT"),
        ("incident", "operator_notes", "TEXT"),
        ("incident", "pdf_status", "VARCHAR(32) DEFAULT 'PENDING'"),
        ("incident", "pdf_path", "VARCHAR(255)"),
        ("incident", "pdf_version", "INTEGER DEFAULT 1"),
        ("incident", "pdf_generated_at", "TIMESTAMP"),
        ("incident", "pdf_hash", "VARCHAR(64)"),

        ("hospital_assignment", "requested_by_user_id", "VARCHAR(64)"),
        ("hospital_assignment", "responded_by_user_id", "VARCHAR(64)"),
        ("hospital_assignment", "responded_at", "TIMESTAMP"),
        ("hospital_assignment", "rejection_reason", "TEXT"),
    ]

    with engine.begin() as conn:
        for table, col, col_def in columns_to_ensure:
            if table not in existing_tables:
                continue
            cols_in_table = [c["name"] for c in inspector.get_columns(table)]
            if col not in cols_in_table:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                    print(f"[MIGRATION] Added column '{col}' to table '{table}'")
                except Exception as ex:
                    print(f"[MIGRATION WARNING] Could not add column '{col}' to '{table}': {ex}")

        # 3. Audit user roles for integrity
        if "user_account" in existing_tables:
            valid_roles = {"ADMINISTRATOR", "ADMIN", "CONTROL_OPERATOR", "HOSPITAL_COORDINATOR", "FIELD_RESPONDER", "ANALYST", "REPORTER"}
            result = conn.execute(text("SELECT user_id, username, email, role FROM user_account")).fetchall()
            invalid_accounts = []
            normalized_count = 0
            for row in result:
                uid, uname, uemail, urole = row[0], row[1], row[2], row[3]
                if not urole or not str(urole).strip():
                    invalid_accounts.append((uid, uname, uemail, "MISSING_ROLE"))
                elif str(urole).upper() == "ADMIN":
                    conn.execute(text("UPDATE user_account SET role = 'ADMINISTRATOR' WHERE user_id = :uid"), {"uid": uid})
                    normalized_count += 1
                elif str(urole).upper() not in valid_roles:
                    invalid_accounts.append((uid, uname, uemail, f"INVALID_ROLE: {urole}"))

            if normalized_count > 0:
                print(f"[MIGRATION] Normalized {normalized_count} account roles from 'ADMIN' to 'ADMINISTRATOR'.")

            # Normalize legacy hospital organization_id references
            conn.execute(text("UPDATE user_account SET organization_id = 'HOSP_001' WHERE organization_id = 'HOSP_01'"))
            
            if invalid_accounts:
                print("[AUDIT ALERT] The following accounts have missing/invalid roles and require Administrator review:")
                for acc in invalid_accounts:
                    print(f"  - User ID: {acc[0]}, Username: {acc[1]}, Email: {acc[2]}, Issue: {acc[3]}")
            else:
                print("[AUDIT] All existing user account roles are valid and mapped to canonical TERA roles.")

    print(f"[MIGRATION] Database schema migration completed successfully on {engine.dialect.name}.")

if __name__ == "__main__":
    run_migrations()
