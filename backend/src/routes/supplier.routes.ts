import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── GET /api/businesses/:businessId/suppliers ─────────────────────────────────
router.get('/', requireBusinessPermission(BusinessActions.SUPPLIERS_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { businessId },
      include: { _count: { select: { bales: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers.', details: err?.message });
  }
});

// ── POST /api/businesses/:businessId/suppliers ────────────────────────────────
router.post('/', requireBusinessPermission(BusinessActions.SUPPLIERS_CREATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { name, phone, email, location, notes } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Supplier name is required.' });
      return;
    }
    const supplier = await prisma.supplier.create({
      data: {
        businessId,
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        location: location || undefined,
        notes: notes || undefined,
      },
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create supplier.', details: err?.message });
  }
});

// ── PATCH /api/businesses/:businessId/suppliers/:supplierId ───────────────────
router.patch('/:supplierId', requireBusinessPermission(BusinessActions.SUPPLIERS_UPDATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  const supplierId = req.params.supplierId as string;
  try {
    const { name, phone, email, location, notes, isActive } = req.body;
    const updated = await prisma.supplier.updateMany({
      where: { id: supplierId, businessId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    if (updated.count === 0) { res.status(404).json({ success: false, error: 'Supplier not found.' }); return; }
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
    res.json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update supplier.', details: err?.message });
  }
});

// ── DELETE /api/businesses/:businessId/suppliers/:supplierId ──────────────────
router.delete('/:supplierId', requireBusinessPermission(BusinessActions.SUPPLIERS_DELETE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  const supplierId = req.params.supplierId as string;
  try {
    await prisma.supplier.updateMany({
      where: { id: supplierId, businessId },
      data: { isActive: false },
    });
    res.json({ success: true, data: { message: 'Supplier deactivated.' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to deactivate supplier.', details: err?.message });
  }
});

export default router;
