/**
 * Bot Routes
 * Refactored to use native PostgreSQL + Prisma ORM
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
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

// Safe JSON parse helper
function safeJsonParse(str: string | null | undefined, fallback: any = []) {
    try {
        return JSON.parse(str || JSON.stringify(fallback));
    } catch {
        return fallback;
    }
}

// Helper to format bot response
function formatBot(bot: any) {
    return {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        avatar: bot.avatar,
        status: bot.status,
        type: bot.type,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
        channels: [],
        taskPacks: safeJsonParse(bot.taskPacks),
        metrics: {
            totalExecutions: bot.totalExecutions,
            successfulExecutions: bot.successfulExecutions,
            failedExecutions: bot.failedExecutions,
            lastActive: bot.lastActiveAt,
            uptime: bot.uptime,
        },
        config: {
            personality: bot.personality,
            memoryScope: bot.memoryScope,
            systemPrompt: bot.systemPrompt,
            modelProvider: bot.modelProvider,
            modelName: bot.modelName,
            temperature: bot.temperature,
            guardrails: [],
            permissions: [],
        },
    };
}

// GET /api/bots
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [bots, total] = await Promise.all([
            prisma.bot.findMany({
                where: { userId: req.userId as string },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.bot.count({
                where: { userId: req.userId as string }
            })
        ]);

        return res.json({
            success: true,
            data: {
                data: bots.map(formatBot),
                total,
                page,
                pageSize: limit,
                hasMore: skip + bots.length < total,
            },
        });
    } catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/bots/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const bot = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        // IDOR Protection: ensure bot belongs to requesting user
        if (!bot || bot.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        return res.json({ success: true, data: formatBot(bot) });
    } catch (error) {
        console.error('Error fetching bot:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/bots
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const data = createBotSchema.parse(req.body);

        const bot = await prisma.bot.create({
            data: {
                name: data.name,
                description: data.description || '',
                type: data.type,
                avatar: data.avatar || '/bots/default.png',
                personality: data.personality || 'friendly and helpful',
                memoryScope: data.memoryScope || 'user',
                systemPrompt: data.systemPrompt,
                modelProvider: data.modelProvider || 'openai',
                modelName: data.modelName || 'gpt-4o',
                temperature: data.temperature ?? 0.7,
                userId: req.userId as string,
            }
        });

        return res.status(201).json({
            success: true,
            data: formatBot(bot),
            message: 'Bot created successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Bot creation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/bots/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateBotSchema.parse(req.body);

        const existing = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updatedBot = await prisma.bot.update({
            where: { id: req.params.id as string },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.avatar && { avatar: data.avatar }),
                ...(data.status && { status: data.status }),
                ...(data.personality && { personality: data.personality }),
                ...(data.memoryScope && { memoryScope: data.memoryScope }),
                ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
                ...(data.modelProvider && { modelProvider: data.modelProvider }),
                ...(data.modelName && { modelName: data.modelName }),
                ...(data.temperature !== undefined && { temperature: data.temperature }),
            }
        });

        return res.json({
            success: true,
            data: formatBot(updatedBot),
            message: 'Bot updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Bot update error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/bots/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        await prisma.bot.delete({
            where: { id: req.params.id as string }
        });

        return res.json({ success: true, message: 'Bot deleted successfully' });
    } catch (error) {
        console.error('Bot delete error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/bots/:id/deploy
router.post('/:id/deploy', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updatedBot = await prisma.bot.update({
            where: { id: req.params.id as string },
            data: { status: 'active' } // Deploy queue triggering happens here later
        });

        return res.json({
            success: true,
            data: formatBot(updatedBot),
            message: 'Bot deployed successfully',
        });
    } catch (error) {
        console.error('Bot deploy error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/bots/:id/start
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updatedBot = await prisma.bot.update({
            where: { id: req.params.id as string },
            data: { status: 'active' }
        });

        return res.json({
            success: true,
            data: formatBot(updatedBot),
            message: 'Bot started',
        });
    } catch (error) {
        console.error('Bot start error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/bots/:id/stop
router.post('/:id/stop', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.bot.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        const updatedBot = await prisma.bot.update({
            where: { id: req.params.id as string },
            data: { status: 'inactive' }
        });

        return res.json({
            success: true,
            data: formatBot(updatedBot),
            message: 'Bot stopped',
        });
    } catch (error) {
        console.error('Bot stop error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
