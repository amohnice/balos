import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, businessName, businessLocation } = req.body;

    if (!name || !email || !password || !businessName) {
      res.status(400).json({ success: false, error: 'name, email, password, and businessName are required.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + first business + membership in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          systemRole: 'OWNER',
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName.trim(),
          location: businessLocation?.trim() || null,
        },
      });

      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      return { user, business };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      systemRole: result.user.systemRole,
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: result.user.id, name: result.user.name, email: result.user.email, systemRole: result.user.systemRole },
        business: { id: result.business.id, name: result.business.name },
      },
    });
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err);
    res.status(500).json({ success: false, error: 'Registration failed.', details: err?.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole,
    });

    // Return user + their businesses
    const memberships = await prisma.businessMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { business: true },
    });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, systemRole: user.systemRole },
        businesses: memberships.map((m) => ({
          id: m.business.id,
          name: m.business.name,
          location: m.business.location,
          role: m.role,
          isActive: m.business.isActive,
        })),
      },
    });
  } catch (err: any) {
    console.error('[POST /api/auth/login]', err);
    res.status(500).json({ success: false, error: 'Login failed.', details: err?.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, systemRole: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const memberships = await prisma.businessMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { business: true },
    });

    res.json({
      success: true,
      data: {
        user,
        businesses: memberships.map((m) => ({
          id: m.business.id,
          name: m.business.name,
          location: m.business.location,
          role: m.role,
          isActive: m.business.isActive,
        })),
      },
    });
  } catch (err: any) {
    console.error('[GET /api/auth/me]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user.', details: err?.message });
  }
});

export default router;
