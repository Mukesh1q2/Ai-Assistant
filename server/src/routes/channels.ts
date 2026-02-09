/**
 * Channel Routes
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
            guildId: channel.guild_id,
            channelId: channel.channel_id,
            phoneNumber: channel.phone_number,
        },
        connectedAt: channel.connected_at,
    };
}

// GET /api/channels
router.get('/', (req: AuthRequest, res: Response) => {
    const channels = db.prepare('SELECT * FROM channels WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.userId) as any[];

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
});

// GET /api/channels/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
    const channel = db.prepare('SELECT * FROM channels WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId) as any;

    if (!channel) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    return res.json({ success: true, data: formatChannel(channel) });
});

// POST /api/channels
router.post('/', (req: AuthRequest, res: Response) => {
    try {
        const data = createChannelSchema.parse(req.body);
        const id = 'ch-' + Date.now();

        db.prepare(`
      INSERT INTO channels (id, type, name, status, token, webhook, guild_id, channel_id, phone_number, connected_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.type,
            data.name,
            'connected',
            data.token || null,
            data.webhook || null,
            data.guildId || null,
            data.channelId || null,
            data.phoneNumber || null,
            new Date().toISOString(),
            req.userId
        );

        const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);

        return res.status(201).json({
            success: true,
            data: formatChannel(channel),
            message: `${data.type} channel connected successfully`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// PUT /api/channels/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
    try {
        const data = updateChannelSchema.parse(req.body);

        const existing = db.prepare('SELECT * FROM channels WHERE id = ? AND user_id = ?')
            .get(req.params.id, req.userId);

        if (!existing) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (data.token !== undefined) { updates.push('token = ?'); values.push(data.token); }
        if (data.webhook !== undefined) { updates.push('webhook = ?'); values.push(data.webhook); }
        if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(req.params.id);

        db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);

        return res.json({
            success: true,
            data: formatChannel(channel),
            message: 'Channel updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        throw error;
    }
});

// DELETE /api/channels/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM channels WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);

    return res.json({ success: true, message: 'Channel disconnected successfully' });
});

// POST /api/channels/:id/reconnect
router.post('/:id/reconnect', (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT id FROM channels WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    db.prepare('UPDATE channels SET status = ?, connected_at = ?, updated_at = ? WHERE id = ?')
        .run('connected', new Date().toISOString(), new Date().toISOString(), req.params.id);

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);

    return res.json({
        success: true,
        data: formatChannel(channel),
        message: 'Channel reconnected successfully',
    });
});

// GET /api/channels/types/list
router.get('/types/list', (_req: AuthRequest, res: Response) => {
    return res.json({
        success: true,
        data: ['telegram', 'discord', 'slack', 'whatsapp', 'email'],
    });
});

export default router;
