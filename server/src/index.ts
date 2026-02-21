/**
 * Clawd Bot Backend Server
 * Express.js with better-sqlite3 (Node 24 compatible)
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import channelRoutes from './routes/channels';
import platformRoutes from './routes/platforms';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';
import { authMiddleware } from './middleware/auth';
import './queue/worker';

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint - creates demo account if not exists
app.post('/api/seed', async (req, res) => {
    try {
        // Check for Admin Key
        const adminKey = req.body.adminKey || req.headers['x-admin-key'];
        if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY)) {
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

        // Create sample channels
        await prisma.channel.create({
            data: {
                type: 'telegram',
                name: 'Family Group',
                status: 'connected',
                connectedAt: new Date(),
                userId: user.id
            }
        });

        await prisma.channel.create({
            data: {
                type: 'slack',
                name: 'Work Slack',
                status: 'connected',
                connectedAt: new Date(),
                userId: user.id
            }
        });

        return res.json({
            success: true,
            message: 'Demo account created',
            credentials: { email: 'demo@clawd.ai', password: 'demo123' },
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

// Platform routes - webhooks are public, setup requires auth
app.use('/api/platforms/telegram/webhook', platformRoutes);
app.use('/api/platforms/whatsapp/webhook', platformRoutes);
app.use('/api/platforms', authMiddleware, platformRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// Start server
if (process.env.VERCEL) {
    // Export for Vercel configuration
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
}

export default app;
