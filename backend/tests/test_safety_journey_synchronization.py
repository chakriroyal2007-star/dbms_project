import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.learning_service import LearningProgressionService

client = TestClient(app)

def test_safety_journey_user_isolation():
    """Verify different session IDs/user keys have strictly isolated progress records."""
    user_a = f"test_iso_a_{uuid.uuid4().hex[:8]}"
    user_b = f"test_iso_b_{uuid.uuid4().hex[:8]}"

    res_a = client.get(f"/api/explore/progress?session_id={user_a}")
    assert res_a.status_code == 200
    data_a = res_a.json()
    init_xp_a = data_a["total_xp"]

    res_b = client.get(f"/api/explore/progress?session_id={user_b}")
    assert res_b.status_code == 200
    data_b = res_b.json()
    init_xp_b = data_b["total_xp"]

    # Award XP to user A only
    client.post("/api/explore/activity/complete", json={
        "session_id": user_a,
        "activity_type": "SCENARIO",
        "activity_id": "iso_scenario_1",
        "score": 100,
        "passed": True
    })

    # User A XP must increase; User B must remain completely unchanged
    res_a_after = client.get(f"/api/explore/progress?session_id={user_a}")
    res_b_after = client.get(f"/api/explore/progress?session_id={user_b}")

    assert res_a_after.json()["total_xp"] > init_xp_a
    assert res_b_after.json()["total_xp"] == init_xp_b

def test_daily_challenge_completion_and_deduplication():
    """Verify completing a daily challenge awards configured XP once and prevents duplicate awards."""
    test_user = f"test_daily_{uuid.uuid4().hex[:8]}"

    # Fetch initial state
    res_init = client.get(f"/api/explore/progress?session_id={test_user}")
    init_xp = res_init.json()["total_xp"]
    challenges = res_init.json()["daily_challenges"]
    assert len(challenges) >= 3
    c1 = next(c for c in challenges if c["id"] == "c1_blind_spot_hazards")
    assert not c1["completed"]

    # Complete challenge c1
    res_complete = client.post("/api/explore/daily-challenge/complete", json={
        "session_id": test_user,
        "challenge_id": "c1_blind_spot_hazards"
    })
    assert res_complete.status_code == 200
    data_comp = res_complete.json()
    assert data_comp["status"] == "success"
    assert data_comp["xp_awarded"] == 50
    assert data_comp["current_total_xp"] == init_xp + 50

    # Progress check: c1 must now be marked completed
    res_check = client.get(f"/api/explore/progress?session_id={test_user}")
    updated_challenges = res_check.json()["daily_challenges"]
    c1_updated = next(c for c in updated_challenges if c["id"] == "c1_blind_spot_hazards")
    assert c1_updated["completed"] is True

    # Retry same daily challenge on same day: MUST be rejected with zero XP
    res_retry = client.post("/api/explore/daily-challenge/complete", json={
        "session_id": test_user,
        "challenge_id": "c1_blind_spot_hazards"
    })
    assert res_retry.status_code == 200
    data_retry = res_retry.json()
    assert data_retry["status"] == "already_completed"
    assert data_retry["xp_awarded"] == 0
    assert data_retry["current_total_xp"] == init_xp + 50

def test_level_progression_mathematics():
    """Verify level progression calculations never produce invalid percentages like 100/1000 (0%)."""
    calc_100 = LearningProgressionService.calculate_level_progression(100)
    assert calc_100["current_level"] == 2
    assert calc_100["level_title"] == "Cautious Commuter"
    assert calc_100["tier_start_xp"] == 100
    assert calc_100["tier_end_xp"] == 250
    assert calc_100["xp_in_level"] == 0
    assert calc_100["xp_needed_in_level"] == 150
    assert calc_100["level_percentage"] == 0
    assert calc_100["overall_milestone_percentage"] == 40  # 100 / 250 is 40%

    calc_175 = LearningProgressionService.calculate_level_progression(175)
    assert calc_175["current_level"] == 2
    assert calc_175["xp_in_level"] == 75
    assert calc_175["xp_needed_in_level"] == 150
    assert calc_175["level_percentage"] == 50  # 75/150 is 50%
    assert calc_175["overall_milestone_percentage"] == 70  # 175 / 250 is 70%

    calc_500 = LearningProgressionService.calculate_level_progression(500)
    assert calc_500["current_level"] == 4
    assert calc_500["level_title"] == "Road Safety Guardian"

def test_activity_completion_updates_aggregate_stats():
    """Verify completions update games count, quizzes count, accuracy, and case studies count."""
    user = f"test_stats_{uuid.uuid4().hex[:8]}"

    # Complete a hazard game
    res_h = client.post("/api/explore/activity/complete", json={
        "session_id": user,
        "activity_type": "HAZARD_GAME",
        "activity_id": "hazard_lvl_1",
        "score": 100,
        "passed": True
    })
    assert res_h.status_code == 200

    # Complete a quiz
    res_q = client.post("/api/explore/activity/complete", json={
        "session_id": user,
        "activity_type": "QUIZ",
        "activity_id": "helmet_quiz_1",
        "score": 90,
        "passed": True
    })
    assert res_q.status_code == 200

    # Complete a case study
    res_cs = client.post("/api/explore/activity/complete", json={
        "session_id": user,
        "activity_type": "CASE_STUDY",
        "activity_id": "case_fog_study",
        "score": 100,
        "passed": True
    })
    assert res_cs.status_code == 200

    prog = client.get(f"/api/explore/progress?session_id={user}").json()
    assert prog["games_completed"] >= 1
    assert prog["quizzes_completed"] == 1
    assert prog["quiz_accuracy_pct"] == 90.0
    assert prog["case_studies_completed"] == 1
    assert prog["lessons_read"] >= 1
