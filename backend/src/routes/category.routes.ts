import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission, requireBalePermission, requireCategoryPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

import { logActivity } from '../lib/activityLog.lib.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── GET /api/bales/:baleId/categories ─────────────────────────────────────────
router.get('/', requireBusinessPermission(BusinessActions.BALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const baleId = req.params.baleId as string;
  try {
    const categories = await prisma.baleCategory.findMany({
      where: { baleId },
      include: { _count: { select: { saleItems: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.', details: err?.message });
  }
});

// ── POST /api/bales/:baleId/categories ────────────────────────────────────────
router.post('/', requireBalePermission(BusinessActions.CATEGORIES_CREATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const baleId = req.params.baleId as string;
  try {
    const { name, description, gender, itemType, quantity, basePrice, pricingMode } = req.body;
    if (!name || !basePrice || !quantity) {
      res.status(400).json({ success: false, error: 'name, basePrice, and quantity are required.' });
      return;
    }

    const bale = await prisma.bale.findUnique({ where: { id: baleId } });
    if (!bale) { res.status(404).json({ success: false, error: 'Bale not found.' }); return; }

    // Check if user has approval permission (owner/manager) for auto-approval
    const membership = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: bale.businessId, userId: req.user!.userId } },
    });

    const canAutoApprove = membership && (membership.role === 'OWNER' || membership.role === 'MANAGER');

    const category = await prisma.baleCategory.create({
      data: {
        baleId,
        businessId: bale.businessId,
        name: name.trim(),
        description: description || undefined,
        gender: gender || undefined,
        itemType: itemType || undefined,
        quantity,
        basePrice,
        currentPrice: basePrice,
        pricingMode: pricingMode || 'FLEXIBLE',
        status: canAutoApprove ? 'APPROVED' : 'PENDING',
        proposedBy: req.user!.userId,
        ...(canAutoApprove && {
          approvedBy: req.user!.userId,
          approvedAt: new Date(),
        }),
      },
    });

    logActivity({
      businessId: bale.businessId,
      userId: req.user!.userId,
      action: canAutoApprove ? 'CATEGORY_CREATED_AND_APPROVED' : 'CATEGORY_PROPOSED',
      details: `${canAutoApprove ? 'Created & approved' : 'Proposed'} stock category "${category.name}" (${quantity} pcs @ KES ${basePrice})`,
      metadata: { categoryId: category.id, baleId, name: category.name, quantity, basePrice },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create category.', details: err?.message });
  }
});

// ── PATCH /api/categories/:id/approve ────────────────────────────────────────
router.patch('/:id/approve', requireCategoryPermission(BusinessActions.CATEGORIES_APPROVE), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const category = await prisma.baleCategory.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user!.userId,
        approvedAt: new Date(),
      },
    });

    logActivity({
      businessId: category.businessId,
      userId: req.user!.userId,
      action: 'CATEGORY_APPROVED',
      details: `Approved stock category "${category.name}" for sale`,
      metadata: { categoryId: category.id, name: category.name },
    });

    res.json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to approve category.', details: err?.message });
  }
});

// ── PATCH /api/categories/:id/markdown ──────────────────────────────────────
router.patch('/:id/markdown', requireBusinessPermission(BusinessActions.CATEGORIES_MARKDOWN), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const { newPrice, reason } = req.body;
    if (!newPrice || typeof newPrice !== 'number' || newPrice < 0) {
      res.status(400).json({ success: false, error: 'Valid newPrice is required.' });
      return;
    }

    const category = await prisma.baleCategory.findUnique({ where: { id } });
    if (!category) { res.status(404).json({ success: false, error: 'Category not found.' }); return; }

    await prisma.$transaction(async (tx) => {
      await tx.priceMarkdown.create({
        data: {
          categoryId: id,
          oldPrice: category.currentPrice,
          newPrice,
          reason: reason || undefined,
          appliedBy: req.user!.userId,
        },
      });

      await tx.baleCategory.update({
        where: { id },
        data: { currentPrice: newPrice, status: 'CLEARANCE' },
      });
    });

    const updated = await prisma.baleCategory.findUnique({
      where: { id },
      include: { markdowns: true },
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to apply markdown.', details: err?.message });
  }
});

// ── GET /api/categories/:id ─────────────────────────────────────────────────
router.get('/:id', requireBusinessPermission(BusinessActions.BALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const category = await prisma.baleCategory.findUnique({
      where: { id },
      include: {
        bale: { select: { id: true, referenceNo: true, grade: true } },
        markdowns: { orderBy: { createdAt: 'desc' } },
        _count: { select: { saleItems: true } },
      },
    });
    if (!category) { res.status(404).json({ success: false, error: 'Category not found.' }); return; }
    res.json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch category.', details: err?.message });
  }
});

export default router;
