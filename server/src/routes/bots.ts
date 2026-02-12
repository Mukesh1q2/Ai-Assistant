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
    systemPrompt: z.string().optional(),
    modelProvider: z.string().optional(),
    modelName: z.string().optional(),
    temperature: z.number().optional(),
});

const updateBotSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    avatar: z.string().optional(),
    status: z.enum(['active', 'inactive', 'deploying', 'error']).optional(),
    personality: z.string().optional(),
    memoryScope: z.enum(['user', 'family', 'global']).optional(),
    systemPrompt: z.string().optional(),
    modelProvider: z.string().optional(),
    modelName: z.string().optional(),
    temperature: z.number().optional(),
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
            systemPrompt: bot.system_prompt,
            modelProvider: bot.model_provider,
            modelName: bot.model_name,
            temperature: bot.temperature,
            guardrails: [],
            permissions: [],
        },
    };
}

// GET /api/bots
router.get('/', async (req: AuthRequest, res: Response) => {
    const bots = await db.prepare('SELECT * FROM bots WHERE user_id = $1 ORDER BY created_at DESC')
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
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const bot = await db.prepare('SELECT * FROM bots WHERE id = $1 AND user_id = $2')
        .get(req.params.id, req.userId) as any;

    if (!bot) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    return res.json({ success: true, data: formatBot(bot) });
});

// POST /api/bots
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const data = createBotSchema.parse(req.body);
        const id = 'bot-' + Date.now();

        await db.prepare(`
      INSERT INTO bots (id, name, description, type, avatar, personality, memory_scope, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

        const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(id);

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
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateBotSchema.parse(req.body);

        const existing = await db.prepare('SELECT * FROM bots WHERE id = $1 AND user_id = $2')
            .get(req.params.id, req.userId);

        if (!existing) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.avatar !== undefined) { updates.push(`avatar = $${paramIndex++}`); values.push(data.avatar); }
        if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }
        if (data.personality !== undefined) { updates.push(`personality = $${paramIndex++}`); values.push(data.personality); }
        if (data.memoryScope !== undefined) { updates.push(`memory_scope = $${paramIndex++}`); values.push(data.memoryScope); }
        if (data.systemPrompt !== undefined) { updates.push(`system_prompt = $${paramIndex++}`); values.push(data.systemPrompt); }
        if (data.modelProvider !== undefined) { updates.push(`model_provider = $${paramIndex++}`); values.push(data.modelProvider); }
        if (data.modelName !== undefined) { updates.push(`model_name = $${paramIndex++}`); values.push(data.modelName); }
        if (data.temperature !== undefined) { updates.push(`temperature = $${paramIndex++}`); values.push(data.temperature); }

        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date().toISOString());

        // Add ID parameter for WHERE clause
        values.push(req.params.id);

        await db.prepare(`UPDATE bots SET ${updates.join(', ')} WHERE id = $${paramIndex}`).run(...values);

        const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(req.params.id);

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
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    const existing = await db.prepare('SELECT id FROM bots WHERE id = $1 AND user_id = $2')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await db.prepare('DELETE FROM bots WHERE id = $1').run(req.params.id);

    return res.json({ success: true, message: 'Bot deleted successfully' });
});

// POST /api/bots/:id/deploy
router.post('/:id/deploy', async (req: AuthRequest, res: Response) => {
    const existing = await db.prepare('SELECT id FROM bots WHERE id = $1 AND user_id = $2')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await db.prepare('UPDATE bots SET status = $1, updated_at = $2 WHERE id = $3')
        .run('active', new Date().toISOString(), req.params.id);

    const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot deployed successfully',
    });
});

// POST /api/bots/:id/start
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
    const existing = await db.prepare('SELECT id FROM bots WHERE id = $1 AND user_id = $2')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await db.prepare('UPDATE bots SET status = $1, updated_at = $2 WHERE id = $3')
        .run('active', new Date().toISOString(), req.params.id);

    const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot started',
    });
});

// POST /api/bots/:id/stop
router.post('/:id/stop', async (req: AuthRequest, res: Response) => {
    const existing = await db.prepare('SELECT id FROM bots WHERE id = $1 AND user_id = $2')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await db.prepare('UPDATE bots SET status = $1, updated_at = $2 WHERE id = $3')
        .run('inactive', new Date().toISOString(), req.params.id);

    const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(req.params.id);

    return res.json({
        success: true,
        data: formatBot(bot),
        message: 'Bot stopped',
    });
});

export default router;
