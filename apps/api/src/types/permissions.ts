import { UserRole } from './index.js';

export type Permission =
  // Parcels
  | 'parcels:search'
  | 'parcels:read_unified'
  | 'parcels:update'
  // Records & Deeds
  | 'records:read'
  | 'registrations:read'
  | 'encumbrances:read'
  | 'litigation:read'
  | 'risk:read'
  // Mutation
  | 'mutation:submit'
  | 'mutation:read_own'
  | 'mutation:read_queue'
  | 'mutation:review'
  | 'mutation:approve_reject'
  | 'mutation:request_field'
  // Field
  | 'field:view_assigned'
  | 'field:capture_observation'
  | 'field:sync'
  // Alerts
  | 'alerts:verify'
  // Audit & Admin
  | 'audit:read'
  | 'audit:verify'
  | 'users:manage'
  | 'system:health'
  | 'system:demo_reset'
  | 'config:manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  citizen: [
    'parcels:search',
    'parcels:read_unified',
    'records:read',
    'registrations:read',
    'encumbrances:read',
    'litigation:read',
    'mutation:submit',
    'mutation:read_own',
  ],
  officer: [
    'parcels:search',
    'parcels:read_unified',
    'parcels:update',
    'records:read',
    'registrations:read',
    'encumbrances:read',
    'litigation:read',
    'risk:read',
    'mutation:read_queue',
    'mutation:review',
    'mutation:approve_reject',
    'mutation:request_field',
    'alerts:verify',
    'field:view_assigned',
    'audit:read',
    'system:health',
  ],
  field_officer: [
    'parcels:search',
    'parcels:read_unified',
    'field:view_assigned',
    'field:capture_observation',
    'field:sync',
    'alerts:verify',
    'system:health',
  ],
  admin: [
    'parcels:search',
    'parcels:read_unified',
    'parcels:update',
    'records:read',
    'registrations:read',
    'encumbrances:read',
    'litigation:read',
    'risk:read',
    'mutation:submit',
    'mutation:read_own',
    'mutation:read_queue',
    'mutation:review',
    'mutation:approve_reject',
    'mutation:request_field',
    'field:view_assigned',
    'field:capture_observation',
    'field:sync',
    'alerts:verify',
    'audit:read',
    'audit:verify',
    'users:manage',
    'system:health',
    'system:demo_reset',
    'config:manage',
  ],
};

export function hasPermission(role: UserRole, requiredPermission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(requiredPermission);
}

export function hasAllPermissions(role: UserRole, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every((p) => hasPermission(role, p));
}
