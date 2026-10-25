#!/usr/bin/env python3
"""
TERA Database Migration Script
Applies safe non-destructive schema migrations for existing database instances.
"""
import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "tera.db"

def run_migrations():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found; skipping migration (create_all will generate fresh schema).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    def add_col_if_missing(table, col, col_def):
        cursor.execute(f"PRAGMA table_info({table})")
        existing_cols = [row[1] for row in cursor.fetchall()]
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
            print(f"[MIGRATION] Added column '{col}' to table '{table}'")

    # UserAccount additions
    add_col_if_missing("user_account", "organization_id", "VARCHAR(64)")
    add_col_if_missing("user_account", "phone_number", "VARCHAR(32)")

    # Incident additions
    add_col_if_missing("incident", "tracking_code", "VARCHAR(32)")
    add_col_if_missing("incident", "tracking_token", "VARCHAR(64)")
    add_col_if_missing("incident", "reporter_name", "VARCHAR(150)")
    add_col_if_missing("incident", "reporter_phone", "VARCHAR(32)")
    add_col_if_missing("incident", "reporter_consent", "BOOLEAN DEFAULT 1")
    add_col_if_missing("incident", "voice_transcript", "TEXT")
    add_col_if_missing("incident", "detected_language", "VARCHAR(32)")
    add_col_if_missing("incident", "location_accuracy_meters", "FLOAT")
    add_col_if_missing("incident", "is_location_verified", "BOOLEAN DEFAULT 0")
    add_col_if_missing("incident", "evidence_urls_json", "JSON")
    add_col_if_missing("incident", "timeline_events_json", "JSON")
    add_col_if_missing("incident", "linked_duplicate_id", "VARCHAR(64)")
    add_col_if_missing("incident", "resolution_notes", "TEXT")

    conn.commit()
    conn.close()
    print("[MIGRATION] Database schema up to date.")

if __name__ == "__main__":
    run_migrations()
