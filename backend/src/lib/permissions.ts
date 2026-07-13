import { prisma } from './prisma.js';

export const BusinessActions = {
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',

  BALES_READ: 'bales:read',
  BALES_CREATE: 'bales:create',
  BALES_UPDATE: 'bales:update',

  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_APPROVE: 'categories:approve',
  CATEGORIES_MARKDOWN: 'categories:markdown',
  BUSINESS_UPDATE: 'business:update',

  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  MEMBERS_READ: 'members:read',
  MEMBERS_MANAGE: 'members:manage',
} as const;

type BusinessRole = 'OWNER' | 'MANAGER' | 'SORTER' | 'CASHIER' | string;

const permissionsMap: Record<BusinessRole, string[]> = {
  OWNER: ['*'],
  MANAGER: [
    BusinessActions.SUPPLIERS_READ,
    BusinessActions.SUPPLIERS_CREATE,
    BusinessActions.SUPPLIERS_UPDATE,
    BusinessActions.SUPPLIERS_DELETE,
    BusinessActions.BALES_READ,
    BusinessActions.BALES_CREATE,
    BusinessActions.BALES_UPDATE,
    BusinessActions.CATEGORIES_APPROVE,
    BusinessActions.CATEGORIES_MARKDOWN,
    BusinessActions.BUSINESS_UPDATE,
    BusinessActions.SALES_READ,
    BusinessActions.MEMBERS_READ,
    BusinessActions.MEMBERS_MANAGE,
  ],
  SORTER: [
    BusinessActions.BALES_READ,
    BusinessActions.BALES_CREATE,
    BusinessActions.CATEGORIES_CREATE,
  ],
  CASHIER: [BusinessActions.SALES_CREATE, BusinessActions.SALES_READ, BusinessActions.BALES_READ],
};

export function roleAllows(role: string | undefined, action: string): boolean {
  if (!role) return false;
  if (role === 'OWNER') return true;
  const allowed = permissionsMap[role as BusinessRole];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.includes(action);
}

export async function checkBusinessPermission(userId: string, businessId: string, action: string): Promise<boolean> {
  if (!userId || !businessId) return false;

  // Super admin bypass is handled by middleware that has access to req.user;
  // this helper only checks membership-based permissions.
  try {
    const membership = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!membership || !membership.isActive) return false;
    return roleAllows(membership.role, action);
  } catch {
    return false;
  }
}

export default {
  BusinessActions,
  roleAllows,
  checkBusinessPermission,
};
