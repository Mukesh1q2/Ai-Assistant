/**
 * Channel Routes
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
const createChannelSchema = z.object({
    type: z.enum(['telegram', 'discord', 'slack', 'whatsapp', 'email']),
    name: z.string().min(1),
    token: z.string().optional(),
    webhook: z.string().optional(),
    guildId: z.string().optional(),
    channelId: z.string().optional(),
    phoneNumber: z.string().optional(),
});

const updateChannelSchema = z.object({
    name: z.string().min(1).optional(),
    token: z.string().optional(),
    webhook: z.string().optional(),
    status: z.enum(['connected', 'disconnected', 'pending', 'error']).optional(),
});

// Helper to format channel response
function formatChannel(channel: any) {
    return {
        id: channel.id,
        type: channel.type,
        name: channel.name,
        status: channel.status,
        config: {
            token: channel.token,
            webhook: channel.webhook,
            guildId: channel.guildId,
            channelId: channel.channelId,
            phoneNumber: channel.phoneNumber,
        },
        connectedAt: channel.connectedAt,
    };
}

// GET /api/channels
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const channels = await prisma.channel.findMany({
            where: { userId: req.userId as string },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({
            success: true,
            data: {
                data: channels.map(formatChannel),
                total: channels.length,
                page: 1,
                pageSize: channels.length,
                hasMore: false,
            },
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/channels/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const channel = await prisma.channel.findUnique({
            where: { id: req.params.id as string }
        });

        if (!channel || channel.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        return res.json({ success: true, data: formatChannel(channel) });
    } catch (error) {
        console.error('Error fetching channel:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/channels
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const data = createChannelSchema.parse(req.body);

        const channel = await prisma.channel.create({
            data: {
                type: data.type,
                name: data.name,
                status: 'connected',
                token: data.token || null,
                webhook: data.webhook || null,
                guildId: data.guildId || null,
                channelId: data.channelId || null,
                phoneNumber: data.phoneNumber || null,
                connectedAt: new Date(),
                userId: req.userId as string,
            }
        });

        return res.status(201).json({
            success: true,
            data: formatChannel(channel),
            message: `${data.type} channel connected successfully`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Channel create error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/channels/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateChannelSchema.parse(req.body);

        const existing = await prisma.channel.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        const updatedChannel = await prisma.channel.update({
            where: { id: req.params.id as string },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.token !== undefined && { token: data.token }),
                ...(data.webhook !== undefined && { webhook: data.webhook }),
                ...(data.status && { status: data.status }),
            }
        });

        return res.json({
            success: true,
            data: formatChannel(updatedChannel),
            message: 'Channel updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
        }
        console.error('Channel update error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/channels/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.channel.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        await prisma.channel.delete({
            where: { id: req.params.id as string }
        });

        return res.json({ success: true, message: 'Channel disconnected successfully' });
    } catch (error) {
        console.error('Channel delete error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/channels/:id/reconnect
router.post('/:id/reconnect', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.channel.findUnique({
            where: { id: req.params.id as string }
        });

        if (!existing || existing.userId !== req.userId as string) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        const updatedChannel = await prisma.channel.update({
            where: { id: req.params.id as string },
            data: {
                status: 'connected',
                connectedAt: new Date(),
            }
        });

        return res.json({
            success: true,
            data: formatChannel(updatedChannel),
            message: 'Channel reconnected successfully',
        });
    } catch (error) {
        console.error('Reconnect error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/channels/types/list
router.get('/types/list', (_req: AuthRequest, res: Response) => {
    return res.json({
        success: true,
        data: ['telegram', 'discord', 'slack', 'whatsapp', 'email'],
    });
});

export default router;
