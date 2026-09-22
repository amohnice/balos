import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireBusinessPermission } from '../middleware/role.middleware.js';
import { BusinessActions } from '../lib/permissions.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// ── GET /api/businesses/:businessId/dashboard ─────────────────────────────────────
router.get('/', requireBusinessPermission(BusinessActions.SALES_READ), async (req: AuthRequest, res: Response): Promise<void> => {
  const businessId = req.params.businessId as string;
  try {

    // Get basic counts
    const [
      totalBales,
      activeBales,
      totalCategories,
      pendingCategories,
      totalSales,
      todaySales,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      prisma.bale.count({ where: { businessId } }),
      prisma.bale.count({ where: { businessId, status: { in: ['SORTING', 'ACTIVE'] } } }),
      prisma.baleCategory.count({ where: { businessId } }),
      prisma.baleCategory.count({ where: { businessId, status: 'PENDING' } }),
      prisma.sale.count({ where: { businessId } }),
      prisma.sale.count({
        where: {
          businessId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.sale.aggregate({
        where: { businessId },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: {
          businessId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get recent sales
    const recentSales = await prisma.sale.findMany({
      where: { businessId },
      include: {
        items: {
          include: { category: { select: { name: true } } },
        },
        cashier: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get pending categories needing approval
    const pendingCategoriesList = await prisma.baleCategory.findMany({
      where: { businessId, status: 'PENDING' },
      include: {
        bale: { select: { id: true, baleNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get top-selling categories
    const topCategories = await prisma.baleCategory.findMany({
      where: { businessId, status: { in: ['APPROVED', 'CLEARANCE'] } },
      orderBy: { soldCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        soldCount: true,
        currentPrice: true,
      },
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalBales,
          activeBales,
          totalCategories,
          pendingCategories,
          totalSales,
          todaySales,
          totalRevenue: totalRevenue._sum?.totalAmount || 0,
          todayRevenue: todayRevenue._sum?.totalAmount || 0,
        },
        recentSales,
        pendingCategories: pendingCategoriesList,
        topCategories,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data.', details: err?.message });
  }
});

export default router;
