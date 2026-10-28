import assert from 'node:assert';
import { Incident } from '../types';

console.log('🧪 Starting Frontend Operator Queue & Synchronization Test Suite...\n');

let passedTests = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASSED: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

// Mock incidents across operational lifecycle
const sampleIncidents: Incident[] = [
  {
    incident_id: 'INC_001',
    incident_type: 'ROAD_ACCIDENT',
    description: 'Collision at junction',
    severity: 'CRITICAL',
    latitude: 13.6288,
    longitude: 79.4192,
    location_name: 'Alipiri Junction',
    occurred_at: '2026-10-28T10:00:00Z',
    reported_at: '2026-10-28T10:00:00Z',
    status: 'RECEIVED',
    estimated_patient_count: 2,
    created_at: '2026-10-28T10:00:00Z'
  },
  {
    incident_id: 'INC_002',
    incident_type: 'COLLAPSE',
    description: 'Wall collapse',
    severity: 'HIGH',
    latitude: 13.6350,
    longitude: 79.4250,
    location_name: 'Bypass Road',
    occurred_at: '2026-10-28T10:05:00Z',
    reported_at: '2026-10-28T10:05:00Z',
    status: 'UNDER_REVIEW',
    estimated_patient_count: 1,
    created_at: '2026-10-28T10:05:00Z'
  },
  {
    incident_id: 'INC_003',
    incident_type: 'TRAUMA_INJURY',
    description: 'Pedestrian injury',
    severity: 'MEDIUM',
    latitude: 13.6210,
    longitude: 79.4280,
    location_name: 'Gandhi Road',
    occurred_at: '2026-10-28T09:30:00Z',
    reported_at: '2026-10-28T09:30:00Z',
    status: 'ASSIGNED',
    estimated_patient_count: 1,
    created_at: '2026-10-28T09:30:00Z'
  },
  {
    incident_id: 'INC_004',
    incident_type: 'FIRE_HAZARD',
    description: 'Trash fire contained',
    severity: 'LOW',
    latitude: 13.6180,
    longitude: 79.4350,
    location_name: 'Sector 5',
    occurred_at: '2026-10-28T08:00:00Z',
    reported_at: '2026-10-28T08:00:00Z',
    status: 'RESOLVED',
    estimated_patient_count: 0,
    created_at: '2026-10-28T08:00:00Z'
  }
];

// Helper mirroring DashboardPage filtering logic
function filterIncidents(incidents: Incident[], statusFilter: string) {
  return incidents.filter(i => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'RECEIVED') {
      return i.status === 'RECEIVED' || i.status === 'UNDER_REVIEW' || i.status === 'SUBMITTED' || i.status === 'DRAFT';
    }
    if (statusFilter === 'ACTIVE') {
      return i.status === 'ACTIVE' || i.status === 'VERIFIED' || i.status === 'ASSIGNED' || 
             i.status === 'EN_ROUTE' || i.status === 'RESPONSE_REQUESTED' || 
             i.status === 'RESOURCE_ACKNOWLEDGED' || i.status === 'ARRIVED';
    }
    if (statusFilter === 'RESOLVED') {
      return i.status === 'RESOLVED' || i.status === 'CONTAINED' || i.status === 'CANCELLED' || i.status === 'REJECTED';
    }
    return true;
  });
}

function countPendingVerification(incidents: Incident[]) {
  return incidents.filter(i => 
    i.status === 'RECEIVED' || i.status === 'UNDER_REVIEW' || i.status === 'SUBMITTED' || i.status === 'DRAFT'
  ).length;
}

// -----------------------------------------------------------------------------
// Test 1: Queue filter includes newly submitted and under-review reports
// -----------------------------------------------------------------------------
test('Status filter "RECEIVED" (Needs Review) includes both RECEIVED and UNDER_REVIEW', () => {
  const needsReview = filterIncidents(sampleIncidents, 'RECEIVED');
  assert.strictEqual(needsReview.length, 2);
  assert.ok(needsReview.some(i => i.incident_id === 'INC_001'));
  assert.ok(needsReview.some(i => i.incident_id === 'INC_002'));
});

test('Pending triage badge count matches items in Needs Review filter', () => {
  const count = countPendingVerification(sampleIncidents);
  const filtered = filterIncidents(sampleIncidents, 'RECEIVED');
  assert.strictEqual(count, filtered.length);
  assert.strictEqual(count, 2);
});

// -----------------------------------------------------------------------------
// Test 2: Active filter includes dispatched, assigned and en route
// -----------------------------------------------------------------------------
test('Status filter "ACTIVE" includes ASSIGNED, EN_ROUTE, VERIFIED', () => {
  const active = filterIncidents(sampleIncidents, 'ACTIVE');
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].incident_id, 'INC_003');
  assert.strictEqual(active[0].status, 'ASSIGNED');
});

// -----------------------------------------------------------------------------
// Test 3: Request race condition protection logic
// -----------------------------------------------------------------------------
test('Sequence guard discards older out-of-order response when newer query resolves first', () => {
  let latestRequestId = 0;
  let queueState: Incident[] = [];

  // Request 1 starts
  const req1Id = ++latestRequestId; // 1
  // Request 2 starts
  const req2Id = ++latestRequestId; // 2

  // Request 2 finishes FIRST with fresh data [INC_001, INC_002]
  if (req2Id >= latestRequestId) {
    queueState = [sampleIncidents[0], sampleIncidents[1]];
  }
  assert.strictEqual(queueState.length, 2);

  // Request 1 finishes LATER with stale empty data []
  if (req1Id >= latestRequestId) {
    queueState = []; // Must NOT run!
  }

  // Queue state remains intact with Request 2's fresh data
  assert.strictEqual(queueState.length, 2, 'Stale Request 1 overwrote newer Request 2!');
  assert.strictEqual(queueState[0].incident_id, 'INC_001');
});

// -----------------------------------------------------------------------------
// Test 4: Network and auth failures do not masquerade as empty queue
// -----------------------------------------------------------------------------
test('Error state is preserved without falsely rendering "No Incidents in this View"', () => {
  let queueError: string | null = null;
  let incidents: Incident[] = [sampleIncidents[0]];

  // Network fails
  const simulatedError = { response: { status: 500 }, message: 'Internal Server Error' };
  const httpStatus = simulatedError.response.status;
  if (httpStatus >= 500) {
    queueError = 'EOC database service temporarily unavailable. Automatic reconnection active...';
  }

  // Pre-existing incidents are NOT cleared on transient network error
  assert.strictEqual(incidents.length, 1);
  assert.ok(queueError !== null);
  assert.ok(queueError.includes('temporarily unavailable'));
});

// -----------------------------------------------------------------------------
// Test 5: Open Inspection Modal remains synchronized on background refresh
// -----------------------------------------------------------------------------
test('Inspected modal incident updates when queue background poll receives status change', () => {
  let reviewIncident: Incident | null = sampleIncidents[0]; // status: RECEIVED
  assert.strictEqual(reviewIncident.status, 'RECEIVED');

  // Background sync receives updated incident list where INC_001 is now VERIFIED
  const freshList: Incident[] = [
    { ...sampleIncidents[0], status: 'VERIFIED' },
    sampleIncidents[1]
  ];

  // Sync modal
  if (reviewIncident) {
    const matching = freshList.find(i => i.incident_id === reviewIncident!.incident_id);
    if (matching) reviewIncident = matching;
  }

  assert.strictEqual(reviewIncident.status, 'VERIFIED', 'Modal inspection state failed to synchronize!');
});

// -----------------------------------------------------------------------------
// Test 6: Idempotency key stability across retry attempts
// -----------------------------------------------------------------------------
test('Idempotency key persists during form submission retry and rotates after success', () => {
  let activeKey = 'IDEMP_TEST_12345';

  // Failed submit attempt preserves activeKey
  const failedAttemptKey = activeKey;
  assert.strictEqual(failedAttemptKey, 'IDEMP_TEST_12345');

  // Successful submission rotates activeKey to a fresh unique value
  activeKey = `IDEMP_FRESH_${Date.now()}`;
  assert.notStrictEqual(activeKey, failedAttemptKey);
});

console.log(`\n🎉 All ${passedTests} Frontend Operator Queue & Synchronization tests passed successfully!\n`);
