/**
 * Settings Routes
 * Manages user API keys for AI providers
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const updateKeysSchema = z.object({
    openai_api_key: z.string().optional(),
    gemini_api_key: z.string().optional(),
    anthropic_api_key: z.string().optional(),
});

// GET /api/settings/keys
router.get('/keys', async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId as string },
            select: {
                openaiApiKey: true,
                geminiApiKey: true,
                anthropicApiKey: true,
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Mask keys for security — show first 4 and last 4 chars only
        const mask = (key: string | null) => key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : null;

        res.json({
            openai_api_key: mask(user.openaiApiKey),
            gemini_api_key: mask(user.geminiApiKey),
            anthropic_api_key: mask(user.anthropicApiKey),
            has_openai: !!user.openaiApiKey,
            has_gemini: !!user.geminiApiKey,
            has_anthropic: !!user.anthropicApiKey,
        });
    } catch (error) {
        console.error('Get keys error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings/keys
router.put('/keys', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateKeysSchema.parse(req.body);

        const updateData: Record<string, string> = {};

        if (data.openai_api_key) {
            updateData.openaiApiKey = data.openai_api_key;
        }
        if (data.gemini_api_key) {
            updateData.geminiApiKey = data.gemini_api_key;
        }
        if (data.anthropic_api_key) {
            updateData.anthropicApiKey = data.anthropic_api_key;
        }

        if (Object.keys(updateData).length === 0) {
            return res.json({ success: true, message: 'No changes' });
        }

        await prisma.user.update({
            where: { id: req.userId as string },
            data: updateData,
        });

        res.json({ success: true, message: 'Keys updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid input' });
        }
        console.error('Update keys error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
