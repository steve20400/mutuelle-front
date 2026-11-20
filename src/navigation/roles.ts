import type { BackendRole } from '@/src/types';

export const ROLE_DISPLAY_NAMES: Record<BackendRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Secretaire',
  PRESIDENT: 'President',
  TRESORIER: 'Tresorier',
  MEMBER: 'Membre',
};

export function getRoleDisplayName(role: BackendRole | null): string {
  if (!role) return '';
  return ROLE_DISPLAY_NAMES[role] ?? role;
}

export function isAdmin(role: BackendRole | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isPresident(role: BackendRole | null): boolean {
  return role === 'PRESIDENT';
}

export function isTresorier(role: BackendRole | null): boolean {
  return role === 'TRESORIER';
}

export function isMember(role: BackendRole | null): boolean {
  return role === 'MEMBER';
}

export function canManageMembers(role: BackendRole | null): boolean {
  return isAdmin(role) || isPresident(role);
}

export function canManageCotisations(role: BackendRole | null): boolean {
  return isAdmin(role) || isPresident(role) || isTresorier(role);
}

export function canManageAssistances(role: BackendRole | null): boolean {
  return isAdmin(role) || isPresident(role);
}

export function canManageTresorerie(role: BackendRole | null): boolean {
  return isTresorier(role) || isAdmin(role);
}

export function canAccessParametres(role: BackendRole | null): boolean {
  return isAdmin(role);
}

export function canMakePayment(role: BackendRole | null): boolean {
  return isAdmin(role);
}

export function canCreateMember(role: BackendRole | null): boolean {
  return isAdmin(role);
}
