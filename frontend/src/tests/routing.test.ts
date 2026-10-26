import assert from 'node:assert';
import { 
  ROLE_DEFAULT_TABS, 
  ROLE_ALLOWED_TABS, 
  getDefaultTabForRole, 
  getValidTabForRole 
} from '../utils/rbacRouting';

console.log('🧪 Starting Frontend Role-Based Routing & RBAC Test Suite...\n');

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

// -----------------------------------------------------------------------------
// 1. Authoritative Default Portal Mapping Tests
// -----------------------------------------------------------------------------
test('CONTROL_OPERATOR maps to EOC Command Center portal ("dashboard")', () => {
  assert.strictEqual(getDefaultTabForRole('CONTROL_OPERATOR'), 'dashboard');
  assert.strictEqual(getDefaultTabForRole('control_operator'), 'dashboard');
});

test('HOSPITAL_COORDINATOR maps to Healthcare Trauma & Bed portal ("hospital_coord")', () => {
  assert.strictEqual(getDefaultTabForRole('HOSPITAL_COORDINATOR'), 'hospital_coord');
  assert.strictEqual(getDefaultTabForRole('hospital_coordinator'), 'hospital_coord');
});

test('FIELD_RESPONDER maps to Ambulance Dispatch portal ("field_responder")', () => {
  assert.strictEqual(getDefaultTabForRole('FIELD_RESPONDER'), 'field_responder');
  assert.strictEqual(getDefaultTabForRole('field_responder'), 'field_responder');
});

test('ANALYST maps to Intelligence & Trends portal ("analytics")', () => {
  assert.strictEqual(getDefaultTabForRole('ANALYST'), 'analytics');
  assert.strictEqual(getDefaultTabForRole('analyst'), 'analytics');
});

test('ADMINISTRATOR & ADMIN map to User Governance portal ("admin_users")', () => {
  assert.strictEqual(getDefaultTabForRole('ADMINISTRATOR'), 'admin_users');
  assert.strictEqual(getDefaultTabForRole('ADMIN'), 'admin_users');
  assert.strictEqual(getDefaultTabForRole('administrator'), 'admin_users');
});

test('REPORTER maps to Citizen SOS portal ("reporter_portal")', () => {
  assert.strictEqual(getDefaultTabForRole('REPORTER'), 'reporter_portal');
  assert.strictEqual(getDefaultTabForRole('reporter'), 'reporter_portal');
});

test('CRITICAL REGRESSION: Undefined or invalid role does NOT silently default to reporter_portal', () => {
  assert.strictEqual(getDefaultTabForRole(undefined), '');
  assert.strictEqual(getDefaultTabForRole(''), '');
  assert.strictEqual(getDefaultTabForRole('UNKNOWN_ROLE'), '');
  assert.strictEqual(getDefaultTabForRole('GUEST'), '');
});

// -----------------------------------------------------------------------------
// 2. Role Guard (getValidTabForRole) Privilege Escalation Prevention
// -----------------------------------------------------------------------------
test('REPORTER is strictly confined to reporter_portal and overview; denied operations/admin tabs', () => {
  assert.strictEqual(getValidTabForRole('dashboard', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('admin_users', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('field_responder', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('analytics', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('allocation', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('reporter_portal', 'REPORTER'), 'reporter_portal');
  assert.strictEqual(getValidTabForRole('dbms_architecture', 'REPORTER'), 'dbms_architecture');
  assert.strictEqual(getValidTabForRole('settings', 'REPORTER'), 'settings');
});

test('FIELD_RESPONDER is confined to field_responder and assigned incidents; denied EOC/admin tabs', () => {
  assert.strictEqual(getValidTabForRole('dashboard', 'FIELD_RESPONDER'), 'field_responder');
  assert.strictEqual(getValidTabForRole('admin_users', 'FIELD_RESPONDER'), 'field_responder');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'FIELD_RESPONDER'), 'field_responder');
  assert.strictEqual(getValidTabForRole('field_responder', 'FIELD_RESPONDER'), 'field_responder');
  assert.strictEqual(getValidTabForRole('incidents', 'FIELD_RESPONDER'), 'incidents');
});

test('HOSPITAL_COORDINATOR is confined to hospital_coord, beds and ambulances; denied EOC command/admin', () => {
  assert.strictEqual(getValidTabForRole('dashboard', 'HOSPITAL_COORDINATOR'), 'hospital_coord');
  assert.strictEqual(getValidTabForRole('admin_users', 'HOSPITAL_COORDINATOR'), 'hospital_coord');
  assert.strictEqual(getValidTabForRole('field_responder', 'HOSPITAL_COORDINATOR'), 'hospital_coord');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'HOSPITAL_COORDINATOR'), 'hospital_coord');
  assert.strictEqual(getValidTabForRole('resources', 'HOSPITAL_COORDINATOR'), 'resources');
  assert.strictEqual(getValidTabForRole('ambulances', 'HOSPITAL_COORDINATOR'), 'ambulances');
});

test('ANALYST is confined to analytics, queries, and explorer; denied dispatch and admin governance', () => {
  assert.strictEqual(getValidTabForRole('dashboard', 'ANALYST'), 'analytics');
  assert.strictEqual(getValidTabForRole('admin_users', 'ANALYST'), 'analytics');
  assert.strictEqual(getValidTabForRole('field_responder', 'ANALYST'), 'analytics');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'ANALYST'), 'analytics');
  assert.strictEqual(getValidTabForRole('analytics', 'ANALYST'), 'analytics');
  assert.strictEqual(getValidTabForRole('sql_playground', 'ANALYST'), 'sql_playground');
  assert.strictEqual(getValidTabForRole('historical', 'ANALYST'), 'historical');
  assert.strictEqual(getValidTabForRole('performance', 'ANALYST'), 'performance');
  assert.strictEqual(getValidTabForRole('explorer', 'ANALYST'), 'explorer');
});

test('CONTROL_OPERATOR has full access to triage, dispatch, allocation; denied user admin governance', () => {
  assert.strictEqual(getValidTabForRole('dashboard', 'CONTROL_OPERATOR'), 'dashboard');
  assert.strictEqual(getValidTabForRole('incidents', 'CONTROL_OPERATOR'), 'incidents');
  assert.strictEqual(getValidTabForRole('ambulances', 'CONTROL_OPERATOR'), 'ambulances');
  assert.strictEqual(getValidTabForRole('hospitals', 'CONTROL_OPERATOR'), 'hospitals');
  assert.strictEqual(getValidTabForRole('allocation', 'CONTROL_OPERATOR'), 'allocation');
  assert.strictEqual(getValidTabForRole('simulation', 'CONTROL_OPERATOR'), 'simulation');
  assert.strictEqual(getValidTabForRole('roads', 'CONTROL_OPERATOR'), 'roads');
  // Denied access to admin user management
  assert.strictEqual(getValidTabForRole('admin_users', 'CONTROL_OPERATOR'), 'dashboard');
  assert.strictEqual(getValidTabForRole('field_responder', 'CONTROL_OPERATOR'), 'dashboard');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'CONTROL_OPERATOR'), 'dashboard');
});

test('ADMINISTRATOR has global oversight across all system portals', () => {
  assert.strictEqual(getValidTabForRole('admin_users', 'ADMINISTRATOR'), 'admin_users');
  assert.strictEqual(getValidTabForRole('dashboard', 'ADMINISTRATOR'), 'dashboard');
  assert.strictEqual(getValidTabForRole('analytics', 'ADMINISTRATOR'), 'analytics');
  assert.strictEqual(getValidTabForRole('hospital_coord', 'ADMINISTRATOR'), 'hospital_coord');
  assert.strictEqual(getValidTabForRole('field_responder', 'ADMINISTRATOR'), 'field_responder');
  assert.strictEqual(getValidTabForRole('reporter_portal', 'ADMINISTRATOR'), 'reporter_portal');
});

test('Unauthenticated or missing userRole fails safely and denies protected tab access', () => {
  assert.strictEqual(getValidTabForRole('dashboard', undefined), '');
  assert.strictEqual(getValidTabForRole('admin_users', ''), '');
  assert.strictEqual(getValidTabForRole('analytics', undefined), '');
});

console.log(`\n🎉 All ${passedTests} Frontend Routing & RBAC tests passed successfully!\n`);
