import type { Response, NextFunction } from 'express';
import { type AuthRequest } from './auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { roleAllows, BusinessActions, checkBusinessPermission } from '../lib/permissions.js';

/**
 * Require the user to have a specific system role (SUPER_ADMIN, OWNER).
 */
export function requireSystemRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.systemRole)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}

/**
 * Require a specific business-level permission (uses `BusinessActions`).
 * Reads `businessId` from `req.params.businessId` and checks membership.role.
 */
export function requireBusinessPermission(action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const businessId = req.params.businessId as string | undefined;
    if (!req.user || !businessId) {
      res.status(403).json({ success: false, error: 'Insufficient permissions.' });
      return;
    }

    // Super admin bypasses all checks
    if (req.user.systemRole === 'SUPER_ADMIN') { next(); return; }

    try {
      const membership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: req.user.userId } },
      });

      if (!membership || !membership.isActive || !roleAllows(membership.role, action)) {
        res.status(403).json({ success: false, error: 'Insufficient business permissions.' });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ success: false, error: 'Permission check failed.' });
    }
  };
}

/**
 * Attach the user's business membership to the request for downstream use.
 */
export function attachMembership() {
  return async (req: AuthRequest & { membership?: any }, res: Response, next: NextFunction): Promise<void> => {
    const businessId = req.params.businessId as string | undefined;
    if (!req.user || !businessId) { next(); return; }

    if (req.user.systemRole === 'SUPER_ADMIN') { next(); return; }

    try {
      const membership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: req.user.userId } },
      });
      (req as any).membership = membership;
      next();
    } catch { next(); }
  };
}
