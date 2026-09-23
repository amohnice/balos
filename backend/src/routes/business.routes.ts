import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

const router = Router();
router.use(authenticate);

// ── GET /api/businesses ───────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.businessMember.findMany({
      where: { userId: req.user!.userId, isActive: true },
      include: {
        business: {
          include: {
            _count: { select: { bales: true, members: true, suppliers: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: memberships.map((m) => ({
        ...m.business,
        role: m.role,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch businesses.', details: err?.message });
  }
});

// ── POST /api/businesses ──────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, location } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Business name is required.' });
      return;
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const business = await tx.business.create({
        data: {
          name: name.trim(),
          description: description?.trim() || undefined,
          location: location?.trim() || undefined,
        },
      });
      await tx.businessMember.create({
        data: { businessId: business.id, userId: req.user!.userId, role: 'OWNER' },
      });
      return business;
    });

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create business.', details: err?.message });
  }
});

// ── GET /api/businesses/:businessId ──────────────────────────────────────────
router.get('/:businessId', requireBusinessPermission(BusinessActions.BALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: { select: { bales: true, members: true, suppliers: true, sales: true } },
      },
    });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found.' }); return; }
    res.json({ success: true, data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch business.', details: err?.message });
  }
});

// ── PATCH /api/businesses/:businessId ─────────────────────────────────────────
router.patch('/:businessId', requireBusinessPermission(BusinessActions.BUSINESS_UPDATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { name, description, location } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name?.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (location !== undefined) updateData.location = location?.trim() || null;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    res.json({ success: true, data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update business.', details: err?.message });
  }
});

// ── GET /api/businesses/:businessId/members ───────────────────────────────────
router.get('/:businessId/members', requireBusinessPermission(BusinessActions.MEMBERS_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const members = await prisma.businessMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ success: true, data: members });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch members.', details: err?.message });
  }
});

// ── POST /api/businesses/:businessId/members ─────────────────────────────────
router.post('/:businessId/members', requireBusinessPermission(BusinessActions.MEMBERS_MANAGE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { name, email, password, role } = req.body;
    const validRoles = ['MANAGER', 'SORTER', 'CASHIER'];
    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: 'name, email, password, and role are required.' });
      return;
    }
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: `Role must be one of: ${validRoles.join(', ')}` });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    await prisma.$transaction(async (tx: any) => {
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, systemRole: 'STAFF' },
        });
      }

      const existing = await tx.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: user!.id } },
      });

      if (existing) {
        await tx.businessMember.update({
          where: { businessId_userId: { businessId, userId: user!.id } },
          data: { role, isActive: true },
        });
      } else {
        await tx.businessMember.create({
          data: { businessId, userId: user!.id, role },
        });
      }
    });

    res.status(201).json({ success: true, data: { message: 'Member added successfully.', userId: user?.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to add member.', details: err?.message });
  }
});

// ── PATCH /api/businesses/:businessId/members/:memberId ──────────────────────
router.patch('/:businessId/members/:memberId', requireBusinessPermission(BusinessActions.MEMBERS_MANAGE), async (req: AuthRequest, res: Response): Promise<void> => {
  const memberId = req.params.memberId as string;
  try {
    const { role, isActive } = req.body;
    const updated = await prisma.businessMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update member.', details: err?.message });
  }
});

export default router;
