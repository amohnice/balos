import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── PATCH /api/categories/:id/approve ────────────────────────────────────────
router.patch('/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const category = await prisma.baleCategory.findUnique({
      where: { id },
      include: { bale: { select: { businessId: true } } },
    });
    if (!category) { res.status(404).json({ success: false, error: 'Category not found.' }); return; }

    const updated = await prisma.baleCategory.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user!.userId,
        approvedAt: new Date(),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to approve category.', details: err?.message });
  }
});

// ── PATCH /api/categories/:id/price (Price Edit / Clearance Markdown) ───────
router.patch('/:id/price', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const { newPrice, reason } = req.body;
    if (newPrice === undefined || typeof newPrice !== 'number' || newPrice <= 0) {
      res.status(400).json({ success: false, error: 'Valid newPrice is required.' });
      return;
    }

    const category = await prisma.baleCategory.findUnique({ where: { id } });
    if (!category) { res.status(404).json({ success: false, error: 'Category not found.' }); return; }

    const isMarkdown = newPrice < category.basePrice;

    await prisma.$transaction(async (tx) => {
      await tx.priceMarkdown.create({
        data: {
          categoryId: id,
          oldPrice: category.currentPrice,
          newPrice,
          reason: reason || (isMarkdown ? 'Clearance price edit' : 'Price adjustment'),
          appliedBy: req.user!.userId,
        },
      });

      await tx.baleCategory.update({
        where: { id },
        data: {
          currentPrice: newPrice,
          basePrice: isMarkdown ? category.basePrice : newPrice,
          ...(isMarkdown ? { status: 'CLEARANCE' } : {}),
        },
      });
    });

    const updated = await prisma.baleCategory.findUnique({
      where: { id },
      include: { markdowns: true },
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update category price.', details: err?.message });
  }
});

// ── PATCH /api/categories/:id/markdown ─────────────────────────────────────
router.patch('/:id/markdown', async (req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
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
