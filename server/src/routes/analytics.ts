import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/analytics
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { period = '30d' } = req.query;

        // Calculate start date based on period
        const startDate = new Date();
        if (period === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (period === '24h') startDate.setDate(startDate.getDate() - 1);
        else startDate.setDate(startDate.getDate() - 30); // default 30d

        const isoStartDate = startDate.toISOString();

        // 1. Execution Stats
        const executionStats = await db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
            FROM executions 
            WHERE user_id = $1 AND created_at >= $2
        `).get(userId, isoStartDate) as any;

        // 2. Executions by Day (for charts)
        const executionsByDay = await db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM executions
            WHERE user_id = $1 AND created_at >= $2
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `).all(userId, isoStartDate) as any[];

        // 3. Bot Usage
        const botUsage = await db.prepare(`
            SELECT 
                b.name,
                COUNT(e.id) as count
            FROM executions e
            JOIN bots b ON e.bot_id = b.id
            WHERE e.user_id = $1 AND e.created_at >= $2
            GROUP BY b.name
            ORDER BY count DESC
            LIMIT 5
        `).all(userId, isoStartDate) as any[];

        // 4. Message Stats
        const messageStats = await db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as received,
                SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as sent
            FROM messages
            WHERE integration_id IN (SELECT id FROM integrations WHERE user_id = $1)
            AND created_at >= $2
        `).get(userId, isoStartDate) as any;

        // 5. Channel Stats (grouped by type)
        const channelStats = await db.prepare(`
            SELECT 
                i.type,
                COUNT(*) as count
            FROM messages m
            JOIN integrations i ON m.integration_id = i.id
            WHERE i.user_id = $1 AND m.created_at >= $2
            GROUP BY i.type
        `).all(userId, isoStartDate) as any[];

        // Format data for frontend
        const data = {
            executions: {
                total: executionStats.total || 0,
                successful: executionStats.successful || 0,
                failed: executionStats.failed || 0,
                byDay: executionsByDay.reduce((acc, curr) => ({ ...acc, [curr.date]: curr.count }), {}),
                byPack: {}, // Not tracking packs yet
            },
            channels: {
                total: messageStats.total || 0,
                active: 0, // Need to join integrations
                messagesReceived: messageStats.received || 0,
                messagesSent: messageStats.sent || 0,
                // Convert [{type: 'telegram', count: 10}] -> {telegram: 10}
                byChannel: channelStats.reduce((acc, curr) => ({ ...acc, [curr.type]: curr.count }), {}),
            },
            bots: {
                total: 0,
                active: 0,
                uptime: 100,
                byBot: botUsage.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.count }), {}),
            },
            period
        };

        res.json(data);
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;
