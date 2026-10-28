"""
Automated Pytest Suite for TERA Explore Master Fixes:
1. 'Someone Is Waiting for You' Campaign & Official Video Library
2. Major Accident Case-Study Library (All 7 Sections A-G)
3. Server-Side Authoritative XP Engine & Deduplication
4. Master 15-Badge Catalog & Persistence
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_campaign_content_and_videos():
    """Verify full 'Someone Is Waiting for You' campaign assets and official videos."""
    res = client.get("/api/explore/campaign")
    assert res.status_code == 200
    data = res.json()
    
    # Hero section
    assert "hero" in data
    hero = data["hero"]
    assert hero["headline"] == "Someone Is Waiting for You."
    assert "Every safe decision protects" in hero["subheadline"]
    assert len(hero["slogans"]) >= 5
    assert len(hero["call_to_actions"]) >= 4
    
    # 6 Emotional Story sections
    assert "stories" in data
    stories = data["stories"]
    assert len(stories) >= 6
    for s in stories:
        assert "title" in s
        assert "character" in s
        assert "story_theme" in s
        assert "quote" in s
        assert "story" in s
        assert "safety_principle" in s
        assert "practical_action" in s
        assert "related_activity_tab" in s
        assert len(s["takeaways"]) >= 3
        
    # Official Video library
    assert "videos" in data
    videos = data["videos"]
    assert len(videos) >= 5
    for v in videos:
        assert "title" in v
        assert "publisher" in v
        assert "embed_url" in v
        assert "external_url" in v
        assert "thumbnail" in v
        assert "key_takeaway" in v

def test_major_accident_case_studies_library():
    """Verify Major Accident Case Studies library with category filters and full 7-section structure."""
    res = client.get("/api/explore/case-studies")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    assert "categories" in data
    assert len(data["categories"]) >= 5
    
    # Test category filtering
    res_fog = client.get("/api/explore/case-studies?category=HIGHWAY_PILEUP")
    assert res_fog.status_code == 200
    fog_cases = res_fog.json()["case_studies"]
    assert len(fog_cases) >= 1
    assert any(c["id"] == "CASE_01_NH44_FOG_PILEUP" for c in fog_cases)
    
    # Test keyword search
    res_search = client.get("/api/explore/case-studies?search=brake")
    assert res_search.status_code == 200
    search_cases = res_search.json()["case_studies"]
    assert len(search_cases) >= 1

def test_case_study_detail_7_section_structure():
    """Verify individual case study page adheres strictly to sections A through G."""
    case_id = "CASE_01_NH44_FOG_PILEUP"
    res = client.get(f"/api/explore/case-studies/{case_id}")
    assert res.status_code == 200
    case = res.json()
    
    # Basic metadata & sensitivity label
    assert case["id"] == case_id
    assert "sensitivity_label" in case
    assert "summary" in case
    
    # Section A: What happened?
    assert "what_happened" in case
    assert len(case["what_happened"]) > 50
    
    # Section B: What do we know?
    assert "what_do_we_know" in case
    know = case["what_do_we_know"]
    assert len(know["confirmed_facts"]) >= 2
    assert "preliminary_or_unconfirmed" in know
    assert "unknown_details" in know
    
    # Section C: How did the crash occur?
    assert "how_crash_occurred" in case
    occur = case["how_crash_occurred"]
    assert "immediate_sequence" in occur
    assert len(occur["contributing_factors"]) >= 2
    assert "road_and_environment" in occur
    assert "vehicle_and_occupant_factors" in occur
    
    # Section D: What could have reduced the risk or severity?
    assert "prevention_measures" in case
    assert len(case["prevention_measures"]) >= 3
    
    # Section E: What can each road user learn?
    assert "road_user_takeaways" in case
    takeaways = case["road_user_takeaways"]
    assert "two_wheeler_riders" in takeaways
    assert "car_drivers_and_passengers" in takeaways
    assert "heavy_vehicle_drivers" in takeaways
    assert "road_authorities" in takeaways
    
    # Section F: Test your understanding (quiz)
    assert "quiz" in case
    quiz = case["quiz"]
    assert len(quiz) >= 2
    for q in quiz:
        assert "question" in q
        assert len(q["options"]) == 4
        assert "correct_index" in q
        assert "explanation" in q
        
    # Section G: Sources and further reading
    assert "sources" in case
    sources = case["sources"]
    assert len(sources) >= 1
    for src in sources:
        assert "title" in src
        assert "publisher" in src
        assert "url" in src

def test_authoritative_xp_awarding_and_deduplication():
    """Verify server-side XP rules, database persistence, and duplicate award prevention."""
    session_id = "test_user_xp_engine_001"
    
    # Initial state
    res_init = client.get(f"/api/explore/progress?session_id={session_id}")
    assert res_init.status_code == 200
    init_xp = res_init.json()["total_xp"]
    
    # 1. Complete a case study (+20 XP)
    res_complete = client.post("/api/explore/activity/complete", json={
        "session_id": session_id,
        "activity_type": "CASE_STUDY",
        "activity_id": "CASE_01_NH44_FOG_PILEUP",
        "score": 100.0,
        "passed": True
    })
    assert res_complete.status_code == 200
    res_data = res_complete.json()
    assert res_data["status"] == "success"
    assert res_data["xp_awarded"] == 20
    assert res_data["current_total_xp"] == init_xp + 20
    
    # 2. Duplicate submission for same case study must NOT award duplicate XP
    res_dup = client.post("/api/explore/activity/complete", json={
        "session_id": session_id,
        "activity_type": "CASE_STUDY",
        "activity_id": "CASE_01_NH44_FOG_PILEUP",
        "score": 100.0,
        "passed": True
    })
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert dup_data["status"] == "already_completed"
    assert dup_data["xp_awarded"] == 0
    assert dup_data["current_total_xp"] == init_xp + 20
    
    # 3. Client cannot fabricate arbitrary XP amounts
    res_game = client.post("/api/explore/activity/complete", json={
        "session_id": session_id,
        "activity_type": "HAZARD_GAME",
        "activity_id": "LVL_01_URBAN_INTERSECTION",
        "score": 100.0,
        "passed": True
    })
    assert res_game.status_code == 200
    # Rule awards exactly 15 XP for HAZARD_GAME
    assert res_game.json()["xp_awarded"] == 15
    assert res_game.json()["current_total_xp"] >= init_xp + 35

def test_master_badge_catalog_and_progression():
    """Verify master 15-badge catalog, earned vs locked progress, and criteria."""
    session_id = "test_user_badges_002"
    res = client.get(f"/api/explore/badges?session_id={session_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["total_badges"] == 15
    badges = data["badges"]
    
    # Verify key badges exist
    badge_ids = [b["id"] for b in badges]
    assert "first_safe_choice" in badge_ids
    assert "safety_explorer" in badge_ids
    assert "knowledge_seeker" in badge_ids
    assert "helmet_champion" in badge_ids
    assert "seatbelt_advocate" in badge_ids
    assert "road_sign_explorer" in badge_ids
    assert "hazard_spotter" in badge_ids
    assert "journey_planner" in badge_ids
    assert "case_investigator" in badge_ids
    assert "safety_scholar" in badge_ids
    assert "prevention_advocate" in badge_ids
    assert "family_advocate" in badge_ids
    assert "three_day_learner" in badge_ids
    assert "seven_day_learner" in badge_ids
    assert "road_safety_master" in badge_ids
    
    for b in badges:
        assert "title" in b
        assert "category" in b
        assert "description" in b
        assert "criteria" in b
        assert "xp_reward" in b
        assert "unlocked" in b
        assert "progress_percentage" in b
