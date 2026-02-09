/**
 * Bot Routes
 * Uses better-sqlite3 for Node 24 compatibility
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Validation schemas
const createBotSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional().default(''),
    type: z.string(),
    avatar: z.string().optional(),
    personality: z.string().optional(),
    memoryScope: z.enum(['user', 'family', 'global']).optional(),
});

const updateBotSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    avatar: z.string().optional(),
    status: z.enum(['active', 'inactive', 'deploying', 'error']).optional(),
    personality: z.string().optional(),
    memoryScope: z.enum(['user', 'family', 'global']).optional(),
});

// Helper to format bot response
function formatBot(bot: any) {
    return {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        avatar: bot.avatar,
        status: bot.status,
        type: bot.type,
        createdAt: bot.created_at,
        updatedAt: bot.updated_at,
        channels: [],
        taskPacks: JSON.parse(bot.task_packs || '[]'),
        metrics: {
            totalExecutions: bot.total_executions,
            successfulExecutions: bot.successful_executions,
            failedExecutions: bot.failed_executions,
            lastActive: bot.last_active_at,
            uptime: bot.uptime,
        },
        config: {
            personality: bot.personality,
            memoryScope: bot.memory_scope,
            guardrails: [],
            permissions: [],
        },
    };
}

// GET /api/bots
router.get('/', (req: AuthRequest, res: Response) => {
    const bots = db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.userId) as any[];

    return res.json({
        success: true,
        data: {
            data: bots.map(formatBot),
            total: bots.length,
            page: 1,
            pageSize: bots.length,
            hasMore: false,
        },
    });
});

// GET /api/bots/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId) as any;

    if (!bot) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    return res.json({ success: true, data: formatBot(bot) });
});

// POST /api/bots
router.post('/', (req: AuthRequest, res: Response) => {
    try {
        const data = createBotSchema.parse(req.body);
        const id = 'bot-' + Date.now();

        db.prepare(`
      INSERT INTO bots (id, name, description, type, avatar, personality, memory_scope, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.name,
            data.description || '',
            data.type,
            data.avatar || '/bots/default.png',
            data.personality || 'friendly and helpful',
            data.memoryScope || 'user',
            req.userId
        );

        const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(id);

        return res.status(201).json({
            success: true,
            data: formatBot(bot),
            message: 'Bot created successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// PUT /api/bots/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
    try {
        const data = updateBotSchema.parse(req.body);

        const existing = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?')
            .get(req.params.id, req.userId);

        if (!existing) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
        if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }
        if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
        if (data.personality !== undefined) { updates.push('personality = ?'); values.push(data.personality); }
        if (data.memoryScope !== undefined) { updates.push('memory_scope = ?'); values.push(data.memoryScope); }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(req.params.id);

        db.prepare(`UPDATE bots SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);

        return res.json({
            success: true,
            data: formatBot(bot),
            message: 'Bot updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// DELETE /api/bots/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM bots WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    db.prepare('DELETE FROM bots WHERE id = ?').run(req.params.id);

    return res.json({ success: true, message: 'Bot deleted successfully' });
});

// POST /api/bots/:id/deploy
router.post('/:id/deploy', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM bots WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    db.prepare('UPDATE bots SET status = ?, updated_at = ? WHERE id = ?')
        .run('active', new Date().toISOString(), req.params.id);

    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot deployed successfully',
    });
});

// POST /api/bots/:id/start
router.post('/:id/start', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM bots WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    db.prepare('UPDATE bots SET status = ?, updated_at = ? WHERE id = ?')
        .run('active', new Date().toISOString(), req.params.id);

    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot started',
    });
});

// POST /api/bots/:id/stop
router.post('/:id/stop', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM bots WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    db.prepare('UPDATE bots SET status = ?, updated_at = ? WHERE id = ?')
        .run('inactive', new Date().toISOString(), req.params.id);

    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot stopped',
    });
});

export default router;
