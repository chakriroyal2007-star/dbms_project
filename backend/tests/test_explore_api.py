import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_explore_statistics():
    """Verify authentic MoRTH 2023 & WHO road safety analytics dataset endpoint."""
    response = client.get("/api/explore/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "MoRTH" in data["metadata"]["source"]
    assert len(data["annual_trends"]) >= 6
    assert data["annual_trends"][-1]["total_accidents"] == 480652
    assert len(data["road_user_breakdown"]) >= 5
    assert any(c["cause"] == "Over-Speeding" for c in data["primary_contributing_causes"])
    assert len(data["peak_accident_hours"]) >= 6

def test_explore_scenarios():
    """Verify interactive decision simulator scenarios."""
    response = client.get("/api/explore/scenarios")
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 6
    scenarios = payload["scenarios"]
    for sc in scenarios:
        assert "id" in sc
        assert "title" in sc
        assert "choices" in sc
        assert len(sc["choices"]) >= 2
        assert any(c["is_safe"] for c in sc["choices"])

def test_explore_hazards():
    """Verify multi-level hazard identification levels."""
    response = client.get("/api/explore/hazards")
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 3
    levels = payload["levels"]
    for lvl in levels:
        assert "level_id" in lvl
        assert "hazards" in lvl
        assert len(lvl["hazards"]) >= 3
        for h in lvl["hazards"]:
            assert "box" in h
            assert "danger_reason" in h
            assert "safe_reaction" in h

def test_explore_quizzes():
    """Verify fact-checked quizzes across categories with deep principle explanations."""
    response = client.get("/api/explore/quizzes")
    assert response.status_code == 200
    payload = response.json()
    assert "questions" in payload
    quizzes = payload["questions"]
    assert len(quizzes) >= 8
    
    # Filter by category
    res_cat = client.get("/api/explore/quizzes?category=HELMET_AND_MOTORCYCLE")
    assert res_cat.status_code == 200
    cat_payload = res_cat.json()
    cat_quizzes = cat_payload.get("questions", [])
    assert len(cat_quizzes) >= 1
    assert all(q["category"] == "HELMET_AND_MOTORCYCLE" for q in cat_quizzes)
    for q in cat_quizzes:
        assert "explanation" in q
        assert "options" in q
        assert len(q["options"]) >= 2

def test_explore_stories():
    """Verify 'Someone Is Waiting for You' campaign stories."""
    response = client.get("/api/explore/stories")
    assert response.status_code == 200
    payload = response.json()
    assert payload["campaign_title"] == "Someone Is Waiting for You"
    assert "stories" in payload
    stories = payload["stories"]
    assert len(stories) >= 3
    for s in stories:
        assert "title" in s
        assert "character" in s
        assert "narrative" in s
        assert "quote" in s
        assert "safety_habit" in s

def test_explore_achievements():
    """Verify defensive mastery badges and definitions."""
    response = client.get("/api/explore/achievements")
    assert response.status_code == 200
    achievements = response.json()
    assert len(achievements) >= 7
    ids = [a["id"] for a in achievements]
    assert "ACH_FIRST_SAFE_CHOICE" in ids
    assert "ACH_FAMILY_ADVOCATE" in ids
    assert "ACH_ROAD_SAFETY_MASTER" in ids

def test_explore_progress_and_pledge():
    """Verify guest progress sync and family pledge signing."""
    # Test progress read
    res_prog = client.get("/api/explore/progress?session_id=test_session_explore")
    assert res_prog.status_code == 200
    prog = res_prog.json()
    assert "total_xp" in prog
    assert "level" in prog
    assert prog["total_xp"] >= 100

    # Test progress update
    res_update = client.post("/api/explore/progress", json={
        "session_id": "test_session_explore",
        "xp_earned": 50,
        "activity_type": "SCENARIO",
        "activity_id": "SCN_01_PHONE_CALL",
        "passed": True
    })
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["status"] == "success"
    assert updated["current_total_xp"] >= 150

    # Test family pledge signing
    res_pledge = client.post("/api/explore/pledge", json={
        "pledge_name": "The Reddy Family",
        "family_members_count": 4,
        "commitments": ["100% Helmet Use", "Never Phone While Riding", "Rear Seatbelts"]
    })
    assert res_pledge.status_code == 200
    pledge_res = res_pledge.json()
    assert pledge_res["status"] == "success"
    assert "pledge_id" in pledge_res
    assert pledge_res["pledge_id"].startswith("PLG_")
    assert pledge_res["pledge_name"] == "The Reddy Family"
