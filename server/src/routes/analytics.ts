import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/analytics
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { period = '30d' } = req.query;

        // Calculate start date based on period
        const startDate = new Date();
        if (period === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (period === '24h') startDate.setDate(startDate.getDate() - 1);
        else startDate.setDate(startDate.getDate() - 30); // default 30d

        const isoStartDate = startDate.toISOString();

        // 1. Execution Stats
        const executionStats: any[] = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
            FROM executions 
            WHERE user_id = ${userId} AND created_at >= ${isoStartDate}
        `;

        const parsedExecStats = executionStats[0] || { total: 0, successful: 0, failed: 0 };

        // 2. Executions by Day (for charts)
        const executionsByDay: any[] = await prisma.$queryRaw`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM executions
            WHERE user_id = ${userId} AND created_at >= ${isoStartDate}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;

        // 3. Bot Usage
        const botUsage: any[] = await prisma.$queryRaw`
            SELECT 
                b.name,
                COUNT(e.id) as count
            FROM executions e
            JOIN bots b ON e.bot_id = b.id
            WHERE e.user_id = ${userId} AND e.created_at >= ${isoStartDate}
            GROUP BY b.name
            ORDER BY count DESC
            LIMIT 5
        `;

        // 4. Message Stats
        const messageStats: any[] = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as received,
                SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as sent
            FROM messages
            WHERE integration_id IN (SELECT id FROM platform_integrations WHERE user_id = ${userId})
            AND created_at >= ${isoStartDate}
        `;

        const parsedMsgStats = messageStats[0] || { total: 0, received: 0, sent: 0 };

        // 5. Channel Stats (grouped by type)
        const channelStats: any[] = await prisma.$queryRaw`
            SELECT 
                i.platform as type,
                COUNT(*) as count
            FROM messages m
            JOIN platform_integrations i ON m.integration_id = i.id
            WHERE i.user_id = ${userId} AND m.created_at >= ${isoStartDate}
            GROUP BY i.platform
        `;

        // Safe Number converter for BigInts returned by postgres COUNT
        const num = (val: any) => Number(val || 0);

        // 6. Actual bot counts
        const totalBots = await prisma.bot.count({ where: { userId } });
        const activeBots = await prisma.bot.count({ where: { userId, status: 'active' } });

        // Format data for frontend
        const data = {
            executions: {
                total: num(parsedExecStats.total),
                successful: num(parsedExecStats.successful),
                failed: num(parsedExecStats.failed),
                byDay: executionsByDay.reduce((acc, curr) => ({ ...acc, [curr.date]: num(curr.count) }), {}),
                byPack: {}, // Not tracking packs yet
            },
            channels: {
                total: num(parsedMsgStats.total),
                active: 0, // Could fetch this separately
                messagesReceived: num(parsedMsgStats.received),
                messagesSent: num(parsedMsgStats.sent),
                byChannel: channelStats.reduce((acc, curr) => ({ ...acc, [curr.type]: num(curr.count) }), {}),
            },
            bots: {
                total: totalBots,
                active: activeBots,
                uptime: totalBots > 0 ? Math.round((activeBots / totalBots) * 100) : 100,
                byBot: botUsage.reduce((acc, curr) => ({ ...acc, [curr.name]: num(curr.count) }), {}),
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
