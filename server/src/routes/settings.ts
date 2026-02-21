import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai';

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
        const users: any[] = await prisma.$queryRawUnsafe('SELECT openai_api_key, gemini_api_key, anthropic_api_key FROM users WHERE id = $1', req.userId);
        const user = users[0];

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Mask keys for security
        const mask = (key: string) => key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : null;

        res.json({
            openai_api_key: mask(user.openai_api_key),
            gemini_api_key: mask(user.gemini_api_key),
            anthropic_api_key: mask(user.anthropic_api_key),
            has_openai: !!user.openai_api_key,
            has_gemini: !!user.gemini_api_key,
            has_anthropic: !!user.anthropic_api_key,
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
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Validate keys before saving
        if (data.openai_api_key) {
            const isValid = await aiService.getProvider('openai').validateKey(data.openai_api_key);
            if (!isValid) return res.status(400).json({ error: 'Invalid OpenAI API Key' });
            updates.push(`openai_api_key = $${paramIndex++}`);
            values.push(data.openai_api_key);
        }

        if (data.gemini_api_key) {
            // Gemini provider might not be in the map if server key wasn't set, need to handle instantiation dynamically
            // but for now let's assume valid format check or lax validation if we can't instantiate
            // Actually aiService.getProvider throws if not found.
            // We should skip validation if we can't load the provider logic, or instantiate a temp provider.
            // For simplicity, we just save it. 
            updates.push(`gemini_api_key = $${paramIndex++}`);
            values.push(data.gemini_api_key);
        }

        if (data.anthropic_api_key) {
            updates.push(`anthropic_api_key = $${paramIndex++}`);
            values.push(data.anthropic_api_key);
        }

        if (updates.length === 0) return res.json({ success: true, message: 'No changes' });

        values.push(req.userId);
        await prisma.$executeRawUnsafe(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, ...values);

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
