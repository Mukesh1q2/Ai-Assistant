/**
 * Authentication Routes
 * Refactored to use Prisma ORM + PostgreSQL natively
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = config.JWT_SECRET;

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
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        preferences: {
            theme: user.theme,
            notifications: Boolean(user.notifications),
            language: user.language,
            timezone: user.timezone,
        },
        plan: {
            id: 'plan-' + user.planTier,
            name: user.planTier ? user.planTier.charAt(0).toUpperCase() + user.planTier.slice(1) : 'Free',
            tier: user.planTier,
            executionQuota: user.executionQuota,
            usedExecutions: user.usedExecutions,
            channelLimit: user.channelLimit,
            packLimit: user.packLimit,
            familySeats: user.familySeats,
        },
    };
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

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
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            data: {
                user: formatUser(updatedUser),
                token,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = signupSchema.parse(req.body);

        const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            data: {
                user: formatUser(user),
                token,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.json({
            success: true,
            data: formatUser(user),
        });
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
