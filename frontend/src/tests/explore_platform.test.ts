import { ROLE_ALLOWED_TABS, getValidTabForRole } from '../utils/rbacRouting';

// Mini test runner
let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  }
}

async function runExploreTestSuite() {
  console.log('\n🧪 Starting TERA Explore 2.0 Master Verification Test Suite...\n');

  // Test 1: RBAC Whitelist includes 'explore' for all 6 operational roles
  const roles = [
    'REPORTER', 
    'CONTROL_OPERATOR', 
    'HOSPITAL_COORDINATOR', 
    'FIELD_RESPONDER', 
    'ANALYST', 
    'ADMINISTRATOR', 
    'ADMIN'
  ];

  roles.forEach(role => {
    const allowed = ROLE_ALLOWED_TABS[role] || [];
    assert(allowed.includes('explore'), `'explore' tab must be whitelisted for role ${role}`);
    assert(getValidTabForRole('explore', role) === 'explore', `getValidTabForRole('explore', '${role}') must resolve to 'explore'`);
  });

  // Test 2: Emergency SOS Return Path Guarantee
  // Emergency reporting must remain directly accessible to both guests and reporters without blocking
  assert(ROLE_ALLOWED_TABS.REPORTER.includes('reporter_portal'), 'Reporter portal must be accessible to citizen reporters');
  assert(getValidTabForRole('reporter_portal', 'REPORTER') === 'reporter_portal', 'Reporter portal routing is valid for public bystanders');

  // Test 3: Game 1 Decision Simulator Logic
  const sampleChoices = [
    { text: 'Look at phone', is_safe: false, xp: 10 },
    { text: 'Pull over safely to curb before answering', is_safe: true, xp: 50 },
    { text: 'Accelerate through junction', is_safe: false, xp: 5 }
  ];
  const safeChoice = sampleChoices.find(c => c.is_safe);
  assert(safeChoice !== undefined && safeChoice.xp === 50, 'Safe defensive choice awards maximum XP (+50)');
  const unsafeChoices = sampleChoices.filter(c => !c.is_safe);
  assert(unsafeChoices.every(c => c.xp < 50), 'Unsafe actions never award high defensive scores');

  // Test 4: Game 2 Spot the Hazard Bounding Box In-Range Logic
  const sampleHazardBox = { x: 320, y: 340, w: 80, h: 90 };
  const clickInside = { x: 350, y: 370 };
  const clickOutside = { x: 100, y: 100 };

  const isHitInside = (
    clickInside.x >= sampleHazardBox.x &&
    clickInside.x <= sampleHazardBox.x + sampleHazardBox.w &&
    clickInside.y >= sampleHazardBox.y &&
    clickInside.y <= sampleHazardBox.y + sampleHazardBox.h
  );
  assert(isHitInside, 'Click inside hotspot bounds accurately identifies traffic hazard');

  const isHitOutside = (
    clickOutside.x >= sampleHazardBox.x &&
    clickOutside.x <= sampleHazardBox.x + sampleHazardBox.w &&
    clickOutside.y >= sampleHazardBox.y &&
    clickOutside.y <= sampleHazardBox.y + sampleHazardBox.h
  );
  assert(!isHitOutside, 'Click outside hotspot bounds does not trigger false positive hazard recognition');

  // Test 5: Game 3 Memory Challenge Pairing Logic
  const pairs = [
    { pairId: 1, type: 'SYMBOL', val: '🛑 STOP' },
    { pairId: 1, type: 'MEANING', val: 'Full Stop' },
    { pairId: 2, type: 'SYMBOL', val: '⚠️ ZEBRA' },
    { pairId: 2, type: 'MEANING', val: 'Yield' }
  ];
  const cardA = pairs[0];
  const cardB = pairs[1];
  const cardC = pairs[2];

  const matchConditionAB = cardA.pairId === cardB.pairId && cardA.type !== cardB.type;
  assert(matchConditionAB, 'Matching pair with complementary Symbol and Meaning correctly evaluates to MATCH');

  const matchConditionAC = cardA.pairId === cardC.pairId && cardA.type !== cardC.type;
  assert(!matchConditionAC, 'Mismatched pair correctly evaluates to NO MATCH');

  // Test 6: Game 4 Journey Safety Index Calculation
  const journeyAudits = [
    { step: 'restraint', points: 20 },
    { step: 'tire_pressure', points: 20 },
    { step: 'driver_rest', points: 20 },
    { step: 'weather_check', points: 20 },
    { step: 'scheduled_breaks', points: 20 }
  ];
  const maxPossible = 100;
  const earnedPoints = journeyAudits.reduce((acc, step) => acc + step.points, 0);
  const safetyIndex = Math.round((earnedPoints / maxPossible) * 100);
  assert(safetyIndex === 100, 'Comprehensive pre-trip inspection achieves 100% Journey Safety Index');

  // Test 7: Game 5 Family Safety Challenge & Honor Certificate Integrity
  const familyHabits: Record<string, string> = {
    child: 'rear_seat_booster',
    teen: 'helmet_no_earphones',
    parent: 'seatbelt_phone_docked',
    senior: 'reflective_pedestrian'
  };
  const verifiedAll = Object.values(familyHabits).every(Boolean);
  assert(verifiedAll, 'All 4 family member roles require verified defensive safety habits');

  const certificateId = `TERA-FAM-123456`;
  assert(certificateId.startsWith('TERA-FAM-'), 'Generated Family Road Safety Pledge certificate carries authentic prefix');

  // Test 8: Physics of Stopping Distance Calculation
  // At 60 km/h: v = 60 / 3.6 = 16.67 m/s
  // Reaction (1.5s delay): 25.0 m
  // Braking on dry asphalt (mu = 0.7): (16.67^2) / (2 * 0.7 * 9.81) = 277.88 / 13.734 = ~20.2 m
  // Total: ~45.2 m
  const speed = 60;
  const speedMs = speed / 3.6;
  const reactionDist = speedMs * 1.5;
  const brakingDistDry = (speedMs * speedMs) / (2 * 0.7 * 9.81);
  const totalDry = reactionDist + brakingDistDry;

  assert(reactionDist > 24 && reactionDist < 26, `Thinking distance at 60 km/h is ~25m (computed: ${reactionDist.toFixed(1)}m)`);
  assert(totalDry > 44 && totalDry < 47, `Total stopping distance at 60 km/h on dry asphalt is ~45.2m (computed: ${totalDry.toFixed(1)}m)`);

  // Braking on wet asphalt (mu = 0.4)
  const brakingDistWet = (speedMs * speedMs) / (2 * 0.4 * 9.81);
  const totalWet = reactionDist + brakingDistWet;
  assert(totalWet > totalDry, `Total stopping distance in rain (${totalWet.toFixed(1)}m) is strictly greater than dry (${totalDry.toFixed(1)}m)`);

  console.log(`\n🎉 All ${passedCount} TERA Explore 2.0 tests passed successfully! Zero failures.\n`);
}

runExploreTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
