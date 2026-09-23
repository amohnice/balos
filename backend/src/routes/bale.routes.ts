import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

import { logActivity } from '../lib/activityLog.lib.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── GET /api/businesses/:businessId/bales ─────────────────────────────────────
router.get('/', requireBusinessPermission(BusinessActions.BALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const bales = await prisma.bale.findMany({
      where: { businessId },
      include: {
        supplier: true,
        categories: {
          select: { id: true, name: true, status: true, quantity: true, soldCount: true },
        },
        _count: { select: { categories: true } },
      },
      orderBy: { purchasedAt: 'desc' },
    });
    res.json({ success: true, data: bales });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch bales.', details: err?.message });
  }
});

// ── POST /api/businesses/:businessId/bales ────────────────────────────────────
router.post('/', requireBusinessPermission(BusinessActions.BALES_CREATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { supplierId, baleNumber, purchasePrice, weightKg, description } = req.body;
    if (!purchasePrice || typeof purchasePrice !== 'number' || purchasePrice < 0) {
      res.status(400).json({ success: false, error: 'Valid purchasePrice is required.' });
      return;
    }

    const bale = await prisma.bale.create({
      data: {
        businessId,
        supplierId: supplierId || undefined,
        baleNumber: baleNumber || undefined,
        purchasePrice,
        weightKg: weightKg || undefined,
        description: description || undefined,
        status: 'ARRIVED',
      },
      include: { supplier: true },
    });

    logActivity({
      businessId,
      userId: req.user!.userId,
      action: 'BALE_CREATED',
      details: `Registered new bale #${bale.baleNumber || bale.id.slice(0, 8)} (KES ${purchasePrice.toLocaleString()})`,
      metadata: { baleId: bale.id, baleNumber: bale.baleNumber, purchasePrice },
    });

    res.status(201).json({ success: true, data: bale });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create bale.', details: err?.message });
  }
});

// ── GET /api/businesses/:businessId/bales/:baleId ───────────────────────────────
router.get('/:baleId', requireBusinessPermission(BusinessActions.BALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  const baleId = req.params.baleId as string;
  try {
    const bale = await prisma.bale.findFirst({
      where: { id: baleId, businessId },
      include: {
        supplier: true,
        categories: {
          include: { _count: { select: { saleItems: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!bale) { res.status(404).json({ success: false, error: 'Bale not found.' }); return; }
    res.json({ success: true, data: bale });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch bale.', details: err?.message });
  }
});

// ── PATCH /api/businesses/:businessId/bales/:baleId ─────────────────────────────
router.patch('/:baleId', requireBusinessPermission(BusinessActions.BALES_UPDATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  const baleId = req.params.baleId as string;
  try {
    const { status, description } = req.body;
    const updated = await prisma.bale.updateMany({
      where: { id: baleId, businessId },
      data: {
        ...(status && { status, ...(status === 'SORTING' && { openedAt: new Date() }) }),
        ...(description !== undefined && { description }),
      },
    });
    if (updated.count === 0) { res.status(404).json({ success: false, error: 'Bale not found.' }); return; }
    const bale = await prisma.bale.findFirst({ where: { id: baleId, businessId } });
    res.json({ success: true, data: bale });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update bale.', details: err?.message });
  }
});

export default router;
