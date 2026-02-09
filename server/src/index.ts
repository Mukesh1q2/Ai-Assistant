/**
 * Clawd Bot Backend Server
 * Express.js with better-sqlite3 (Node 24 compatible)
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { db } from './db';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import channelRoutes from './routes/channels';
import platformRoutes from './routes/platforms';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint - creates demo account if not exists
app.post('/api/seed', async (_req, res) => {
    try {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@clawd.ai');

        if (existing) {
            return res.json({ success: true, message: 'Demo account already exists' });
        }

        const hashedPassword = await bcrypt.hash('demo123', 10);
        const id = 'user-' + Date.now();

        db.prepare(`
      INSERT INTO users (id, email, password, name, avatar, plan_tier, execution_quota)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'demo@clawd.ai', hashedPassword, 'Demo User',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 'pro', 5000);

        // Create sample bots
        const bots = [
            { name: 'Email Assistant', desc: 'Manages inbox and drafts', type: 'email', status: 'active' },
            { name: 'Calendar Bot', desc: 'Schedules and reminders', type: 'calendar', status: 'active' },
            { name: 'Chores Manager', desc: 'Tracks household tasks', type: 'chores', status: 'inactive' },
        ];

        const insertBot = db.prepare(`
      INSERT INTO bots (id, name, description, type, status, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        for (const bot of bots) {
            insertBot.run('bot-' + Date.now() + Math.random(), bot.name, bot.desc, bot.type, bot.status, id);
        }

        // Create sample channels
        const insertChannel = db.prepare(`
      INSERT INTO channels (id, type, name, status, connected_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        insertChannel.run('ch-' + Date.now() + '1', 'telegram', 'Family Group', 'connected', new Date().toISOString(), id);
        insertChannel.run('ch-' + Date.now() + '2', 'slack', 'Work Slack', 'connected', new Date().toISOString(), id);

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
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});

export { db };
