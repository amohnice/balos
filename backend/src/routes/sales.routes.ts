import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

import { logActivity } from '../lib/activityLog.lib.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── POST /api/businesses/:businessId/sales ───────────────────────────────────
router.post('/', requireBusinessPermission(BusinessActions.SALES_CREATE), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { items, paymentMethod, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'items array is required.' });
      return;
    }

    const validPaymentMethods = ['CASH', 'MPESA', 'CARD'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({ success: false, error: `paymentMethod must be one of: ${validPaymentMethods.join(', ')}` });
      return;
    }

    let totalAmount = 0;

    // Validate all categories and calculate total
    for (const item of items) {
      const { categoryId, quantity, unitPrice } = item;
      if (!categoryId || !quantity || !unitPrice) {
        res.status(400).json({ success: false, error: 'Each item must have categoryId, quantity, and unitPrice.' });
        return;
      }

      const category = await prisma.baleCategory.findUnique({ where: { id: categoryId as string } });

      if (!category) {
        res.status(404).json({ success: false, error: `Category ${categoryId} not found.` });
        return;
      }

      if (category.status !== 'APPROVED' && category.status !== 'CLEARANCE') {
        res.status(400).json({ success: false, error: `Category ${category.name} is not available for sale.` });
        return;
      }

      // Price enforcement
      if (category.pricingMode === 'FIXED' && unitPrice !== category.currentPrice) {
        res.status(400).json({ success: false, error: `Category ${category.name} has fixed pricing. Price must be ${category.currentPrice}.` });
        return;
      }

      if (category.pricingMode === 'FLEXIBLE' && unitPrice < category.currentPrice) {
        res.status(400).json({ success: false, error: `Category ${category.name} minimum price is ${category.currentPrice}.` });
        return;
      }

      totalAmount += quantity * unitPrice;
    }

    // Create sale with items in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          businessId,
          cashierId: req.user!.userId,
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || undefined,
        },
      });

      for (const item of items) {
        const { categoryId, quantity, unitPrice } = item;
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            categoryId: categoryId as string,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
          },
        });

        await tx.baleCategory.update({
          where: { id: categoryId as string },
          data: { soldCount: { increment: quantity } },
        });
      }

      return newSale;
    });

    const saleWithItems = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: { include: { category: { select: { id: true, name: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    });

    logActivity({
      businessId,
      userId: req.user!.userId,
      action: 'SALE_COMPLETED',
      details: `Completed sale of KES ${totalAmount.toLocaleString()} (${items.length} item type(s)) via ${paymentMethod || 'CASH'}`,
      metadata: { saleId: sale.id, totalAmount, paymentMethod: paymentMethod || 'CASH' },
    });

    res.status(201).json({ success: true, data: saleWithItems });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create sale.', details: err?.message });
  }
});

// ── GET /api/businesses/:businessId/sales/active-categories ──────────────────
// Must be defined BEFORE /:saleId to avoid route conflict
router.get('/active-categories', requireBusinessPermission(BusinessActions.SALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const categories = await prisma.baleCategory.findMany({
      where: {
        businessId,
        status: { in: ['APPROVED', 'CLEARANCE'] },
      },
      include: { bale: { select: { id: true, baleNumber: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch active categories.', details: err?.message });
  }
});

// ── GET /api/businesses/:businessId/sales ────────────────────────────────────
router.get('/', requireBusinessPermission(BusinessActions.SALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {
    const { limit = 50, offset = 0 } = req.query;
    const sales = await prisma.sale.findMany({
      where: { businessId },
      include: {
        items: { include: { category: { select: { id: true, name: true } } } },
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
    res.json({ success: true, data: sales });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch sales.', details: err?.message });
  }
});

export default router;
