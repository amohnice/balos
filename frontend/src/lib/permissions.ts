import { StoredUser, StoredBusiness } from './auth';

export function getMembership(user: StoredUser | null, businessId: string): StoredBusiness | undefined {
  if (!user || !user.businesses) return undefined;
  return user.businesses.find((b) => b.id === businessId);
}

export function hasSystemRole(user: StoredUser | null, roles: string[] = []): boolean {
  if (!user) return false;
  return roles.includes(user.systemRole);
}

export function hasBusinessRole(user: StoredUser | null, businessId: string | undefined, roles: string[] = []): boolean {
  if (!user) return false;
  if (user.systemRole === 'SUPER_ADMIN') return true;
  if (!businessId) return false;
  const membership = getMembership(user, businessId);
  if (!membership || !membership.isActive) return false;
  if (roles.length === 0) return true; // any active member
  return membership.role ? roles.includes(membership.role) : false;
}
