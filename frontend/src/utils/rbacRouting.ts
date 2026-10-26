/**
 * TERA Authoritative Role-Based Access Control (RBAC) & Portal Routing Engine
 */

export type RoleType = 
  | 'REPORTER' 
  | 'CONTROL_OPERATOR' 
  | 'HOSPITAL_COORDINATOR' 
  | 'FIELD_RESPONDER' 
  | 'ANALYST' 
  | 'ADMINISTRATOR' 
  | 'ADMIN';

// Canonical default tab mapping for each authenticated role
export const ROLE_DEFAULT_TABS: Record<string, string> = {
  REPORTER: 'reporter_portal',
  CONTROL_OPERATOR: 'dashboard',
  HOSPITAL_COORDINATOR: 'hospital_coord',
  FIELD_RESPONDER: 'field_responder',
  ANALYST: 'analytics',
  ADMINISTRATOR: 'admin_users',
  ADMIN: 'admin_users',
};

// Strict whitelist of permitted tabs per role
export const ROLE_ALLOWED_TABS: Record<string, string[]> = {
  REPORTER: ['reporter_portal', 'settings', 'dbms_architecture'],
  FIELD_RESPONDER: ['field_responder', 'incidents', 'settings', 'dbms_architecture'],
  HOSPITAL_COORDINATOR: ['hospital_coord', 'resources', 'ambulances', 'incidents', 'settings', 'dbms_architecture'],
  ANALYST: ['analytics', 'historical', 'sql_playground', 'performance', 'explorer', 'dbms_architecture', 'settings'],
  CONTROL_OPERATOR: [
    'dashboard', 'incidents', 'ambulances', 'hospitals', 'resources', 
    'teams', 'roads', 'allocation', 'simulation', 'historical', 
    'settings', 'dbms_architecture'
  ],
  ADMINISTRATOR: [
    'admin_users', 'dashboard', 'incidents', 'ambulances', 'hospitals', 
    'resources', 'teams', 'roads', 'allocation', 'simulation', 'historical', 
    'analytics', 'sql_playground', 'performance', 'explorer', 'hospital_coord', 
    'field_responder', 'reporter_portal', 'settings', 'dbms_architecture'
  ],
  ADMIN: [
    'admin_users', 'dashboard', 'incidents', 'ambulances', 'hospitals', 
    'resources', 'teams', 'roads', 'allocation', 'simulation', 'historical', 
    'analytics', 'sql_playground', 'performance', 'explorer', 'hospital_coord', 
    'field_responder', 'reporter_portal', 'settings', 'dbms_architecture'
  ]
};

/**
 * Returns the default authorized portal tab for a role.
 * Fails safely by returning empty string instead of defaulting to any arbitrary portal.
 */
export const getDefaultTabForRole = (role?: string): string => {
  if (!role) return '';
  return ROLE_DEFAULT_TABS[role.toUpperCase()] || '';
};

/**
 * Validates a target tab against the user's authoritative role.
 * If permitted, returns the tab; otherwise returns the role's default portal tab.
 * Fails safely by returning empty string if role is undefined or unmapped.
 */
export const getValidTabForRole = (tab: string, userRole?: string): string => {
  if (!userRole) return '';
  const normalizedRole = userRole.toUpperCase();
  const allowed = ROLE_ALLOWED_TABS[normalizedRole];
  if (!allowed) return '';
  if (allowed.includes(tab)) return tab;
  return getDefaultTabForRole(normalizedRole);
};
