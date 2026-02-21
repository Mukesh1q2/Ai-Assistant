/**
 * Clawd Bot Backend Server
 * Express.js + Prisma + BullMQ
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db';
import { config } from './config';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import channelRoutes from './routes/channels';
import platformRoutes from './routes/platforms';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';
import { authMiddleware } from './middleware/auth';
import './queue/worker';

const app = express();
const PORT = config.PORT;

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS — uses validated config
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

// Body parser with explicit size limit
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint - creates demo account if not exists
app.post('/api/seed', async (req, res) => {
    try {
        const adminKey = req.body.adminKey || req.headers['x-admin-key'];
        if (!config.ADMIN_KEY || adminKey !== config.ADMIN_KEY) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const existing = await prisma.user.findUnique({
            where: { email: 'demo@clawd.ai' },
            select: { id: true }
        });

        if (existing) {
            return res.json({ success: true, message: 'Demo account already exists' });
        }

        const hashedPassword = await bcrypt.hash('demo123', 10);

        const user = await prisma.user.create({
            data: {
                email: 'demo@clawd.ai',
                password: hashedPassword,
                name: 'Demo User',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                planTier: 'pro',
                executionQuota: 5000,
            }
        });

        // Create sample bots
        const bots = [
            { name: 'Email Assistant', desc: 'Manages inbox and drafts', type: 'email', status: 'active' },
            { name: 'Calendar Bot', desc: 'Schedules and reminders', type: 'calendar', status: 'active' },
            { name: 'Chores Manager', desc: 'Tracks household tasks', type: 'chores', status: 'inactive' },
        ];

        for (const bot of bots) {
            await prisma.bot.create({
                data: {
                    name: bot.name,
                    description: bot.desc,
                    type: bot.type,
                    status: bot.status,
                    userId: user.id
                }
            });
        }

        return res.json({
            success: true,
            message: 'Demo account created',
        });
    } catch (error) {
        console.error('Seed error:', error);
        return res.status(500).json({ success: false, error: 'Failed to seed database' });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', authMiddleware, botRoutes);
app.use('/api/channels', authMiddleware, channelRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Platform routes — single mount point, webhooks handle their own auth
app.use('/api/platforms', platformRoutes);

// Error handler — sanitize errors in production
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    const message = config.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';
    res.status(500).json({ success: false, error: message });
});

// Start server
if (process.env.VERCEL) {
    module.exports = app;
} else {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await prisma.$disconnect();
            console.log('✅ Server closed');
            process.exit(0);
        });
        // Force exit after 10s
        setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
