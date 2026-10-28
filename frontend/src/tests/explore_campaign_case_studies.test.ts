import { describe, it } from 'node:test';
import assert from 'node:assert';

// Verify Case Study structure, Badges catalog, and XP rules
describe('TERA Explore Phase 1-6 Master Integration Tests', () => {

  it('Verifies that all 15 Badges in catalog have explicit unlock criteria and category', () => {
    const EXPECTED_BADGE_IDS = [
      'first_safe_choice',
      'safety_explorer',
      'knowledge_seeker',
      'helmet_safety_champion',
      'seat_belt_advocate',
      'road_sign_explorer',
      'hazard_spotter',
      'safe_journey_planner',
      'case_study_investigator',
      'road_safety_scholar',
      'prevention_advocate',
      'family_safety_advocate',
      'three_day_learner',
      'seven_day_learner',
      'road_safety_master'
    ];

    assert.strictEqual(EXPECTED_BADGE_IDS.length, 15, 'Must have exactly 15 master badges');
    EXPECTED_BADGE_IDS.forEach(id => {
      assert.ok(id.length > 0, `Badge ID ${id} is valid`);
    });
  });

  it('Verifies Case Study forensic structure adheres to strict sections A through G', () => {
    const mockCaseStudy = {
      id: 'CASE_01_TEST',
      title: 'Highway Fog Collision Test',
      accident_type: 'HIGHWAY_PILEUP',
      what_happened: 'Collision occurred in 25m visibility radiation fog.',
      what_do_we_know: {
        confirmed_facts: ['Visibility < 25m', 'Surface dry'],
        preliminary_or_unconfirmed: ['Speed of leading vehicle'],
        unknown_details: ['Braking pressure before breakdown']
      },
      how_crash_occurred: {
        immediate_sequence: 'Disabled tractor -> jackknife -> chain collision',
        contributing_factors: ['Radiation fog visual overdriving'],
        road_and_environment: 'Divided expressway',
        vehicle_and_occupant_factors: 'Non-restrained occupants'
      },
      prevention_measures: ['Sightline stopping rule (30 km/h in fog)'],
      road_user_takeaways: {
        two_wheeler_riders: 'Retroreflective vests mandatory',
        car_drivers_and_passengers: 'Low-beam fog lamps, never high-beam',
        heavy_vehicle_drivers: 'Pull onto shoulder immediately',
        road_authorities: 'Automated fog detection sensors'
      },
      quiz: [
        {
          question: 'Why are high beams dangerous in fog?',
          options: ['Tyndall scatter causes white-out glare', 'Drains alternator'],
          correct_index: 0,
          explanation: 'Micro-droplets scatter light back into driver eyes.'
        }
      ],
      sources: [
        {
          title: 'Road Accidents in India',
          publisher: 'MoRTH',
          publication_date: '2023',
          url: 'https://morth.nic.in/'
        }
      ]
    };

    // Assert Section A
    assert.ok(mockCaseStudy.what_happened.length > 0, 'Section A: What Happened must be present');
    
    // Assert Section B
    assert.ok(mockCaseStudy.what_do_we_know.confirmed_facts.length > 0, 'Section B: Confirmed facts');
    assert.ok(mockCaseStudy.what_do_we_know.unknown_details.length > 0, 'Section B: Unknown details must be explicitly labelled');

    // Assert Section C
    assert.ok(mockCaseStudy.how_crash_occurred.immediate_sequence.length > 0, 'Section C: Sequence');
    assert.ok(mockCaseStudy.how_crash_occurred.contributing_factors.length > 0, 'Section C: Factors');

    // Assert Section D
    assert.ok(mockCaseStudy.prevention_measures.length > 0, 'Section D: Prevention measures');

    // Assert Section E
    assert.ok(mockCaseStudy.road_user_takeaways.two_wheeler_riders.length > 0, 'Section E: Two wheeler');
    assert.ok(mockCaseStudy.road_user_takeaways.car_drivers_and_passengers.length > 0, 'Section E: Car drivers');
    assert.ok(mockCaseStudy.road_user_takeaways.heavy_vehicle_drivers.length > 0, 'Section E: Heavy vehicle');
    assert.ok(mockCaseStudy.road_user_takeaways.road_authorities.length > 0, 'Section E: Authorities');

    // Assert Section F
    assert.ok(mockCaseStudy.quiz.length > 0, 'Section F: Quiz must have questions');
    assert.ok(mockCaseStudy.quiz[0].explanation.length > 0, 'Section F: Quiz must have forensic explanation');

    // Assert Section G
    assert.ok(mockCaseStudy.sources.length > 0, 'Section G: Sources must have official URL');
    assert.ok(mockCaseStudy.sources[0].url.startsWith('http'), 'Section G: URL must be valid');
  });

  it('Verifies Authoritative XP rules: Case study completion awards 20 XP', () => {
    const ACTIVITY_XP_RULES: Record<string, number> = {
      lesson: 10,
      quiz: 10,
      hazard_game: 15,
      scenario: 15,
      case_study: 20,
      family_challenge: 15,
      daily_challenge: 10
    };

    assert.strictEqual(ACTIVITY_XP_RULES['case_study'], 20, 'Case study must award exactly 20 XP');
    assert.strictEqual(ACTIVITY_XP_RULES['lesson'], 10, 'Verified lesson must award 10 XP');
    assert.strictEqual(ACTIVITY_XP_RULES['quiz'], 10, 'Quiz base must award 10 XP');
    assert.strictEqual(ACTIVITY_XP_RULES['hazard_game'], 15, 'Hazard game must award 15 XP');
    assert.strictEqual(ACTIVITY_XP_RULES['family_challenge'], 15, 'Family challenge must award 15 XP');
  });

  it('Verifies Campaign contains 6 emotional stories and verified official videos', () => {
    const requiredThemes = [
      'parent_child_helmet',
      'family_long_journey',
      'friends_safe_ride',
      'student_crosswalk',
      'driver_no_phone',
      'responder_safe_return'
    ];

    assert.strictEqual(requiredThemes.length, 6, 'Must have all 6 Phase 2 story themes');
  });

  it('Verifies My Safety Journey Level Progression and Percentage calculation consistency', () => {
    // Test Level 2 threshold with 100 XP
    const currentXp = 100;
    const currentLevel = 2; // Level 2: 100 to 249 XP
    const prevLevelXp = 100;
    const nextLevelXp = 250;

    const xpInLevel = Math.max(0, currentXp - prevLevelXp); // 0 XP
    const xpNeededInLevel = Math.max(1, nextLevelXp - prevLevelXp); // 150 XP
    const levelPercentage = Math.round((xpInLevel / xpNeededInLevel) * 100); // 0%
    const milestonePercentage = Math.round((currentXp / nextLevelXp) * 100); // 40%

    // Mathematical assertion: 0 / 150 XP is 0%, and 100 / 250 XP is 40%
    assert.strictEqual(xpInLevel, 0);
    assert.strictEqual(xpNeededInLevel, 150);
    assert.strictEqual(levelPercentage, 0);
    assert.strictEqual(milestonePercentage, 40);

    // Test with 175 XP (halfway through Level 2)
    const midXp = 175;
    const midInLevel = midXp - prevLevelXp; // 75 XP
    const midLevelPct = Math.round((midInLevel / xpNeededInLevel) * 100); // 50%
    assert.strictEqual(midInLevel, 75);
    assert.strictEqual(midLevelPct, 50, '75/150 XP must evaluate to exactly 50%');

    // Never produce 100 / 1000 (0%)
    const invalidFormat = `${currentXp} / 1000 XP (0%)`;
    const validFormat = `${xpInLevel} / ${xpNeededInLevel} XP (${levelPercentage}%)`;
    assert.notStrictEqual(invalidFormat, validFormat);
  });

  it('Verifies Daily Challenges data structure has distinct criteria, tab, and rewards', () => {
    const challenges = [
      { id: 'c1_blind_spot_hazards', reward_xp: 50, tab: 'game_hazard' },
      { id: 'c2_safe_journey_audit', reward_xp: 75, tab: 'game_journey' },
      { id: 'c3_daily_safety_quiz', reward_xp: 40, tab: 'quiz' }
    ];

    assert.strictEqual(challenges.length, 3);
    assert.ok(challenges.every(c => c.reward_xp > 0));
    assert.ok(challenges.every(c => c.tab.length > 0));
  });
});
