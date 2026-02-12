/**
 * Authentication Routes
 * Uses better-sqlite3 for Node 24 compatibility
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'clawd-secret-key-change-in-production';

// Validation schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const signupSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});

// Helper to format user response
function formatUser(user: any) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        preferences: {
            theme: user.theme,
            notifications: Boolean(user.notifications),
            language: user.language,
            timezone: user.timezone,
        },
        plan: {
            id: 'plan-' + user.plan_tier,
            name: user.plan_tier.charAt(0).toUpperCase() + user.plan_tier.slice(1),
            tier: user.plan_tier,
            executionQuota: user.execution_quota,
            usedExecutions: user.used_executions,
            channelLimit: user.channel_limit,
            packLimit: user.pack_limit,
            familySeats: user.family_seats,
        },
    };
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await db.prepare('SELECT * FROM users WHERE email = $1').get(email) as any;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Update last login
        await db.prepare('UPDATE users SET last_login_at = $1 WHERE id = $2')
            .run(new Date().toISOString(), user.id);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            data: {
                user: formatUser(user),
                token,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = signupSchema.parse(req.body);

        const existing = await db.prepare('SELECT id FROM users WHERE email = $1').get(email);
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = 'user-' + Date.now();

        await db.prepare(`
      INSERT INTO users (id, email, password, name, avatar)
      VALUES ($1, $2, $3, $4, $5)
    `).run(id, email, hashedPassword, name, `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`);

        const user = await db.prepare('SELECT * FROM users WHERE id = $1').get(id);
        const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            data: {
                user: formatUser(user),
                token,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    const user = await db.prepare('SELECT * FROM users WHERE id = $1').get(req.userId) as any;

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
        success: true,
        data: formatUser(user),
    });
});

export default router;
