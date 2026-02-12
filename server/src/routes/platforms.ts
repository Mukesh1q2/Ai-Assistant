/**
 * Platform Integration Routes
 * Handles Telegram and WhatsApp setup, webhooks, and messaging
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { TelegramIntegration, WhatsAppIntegration } from '../integrations/index.js';
import { aiService } from '../services/ai';

const router = Router();

// ============================================
// TELEGRAM ROUTES
// ============================================

/**
 * POST /api/platforms/telegram/setup
 * Validate token and create Telegram integration
 */
router.post('/telegram/setup', async (req: Request, res: Response) => {
    try {
        const { botToken, webhookBaseUrl } = req.body;
        const userId = (req as any).userId;

        if (!botToken) {
            return res.status(400).json({ error: 'Bot token is required' });
        }

        // Validate the token
        const telegram = new TelegramIntegration(botToken);
        const validation = await telegram.validateToken();

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid bot token',
                details: validation.error
            });
        }

        // Generate webhook secret
        const webhookSecret = uuid();
        const integrationId = uuid();

        // Set up webhook if base URL provided
        let webhookUrl = null;
        if (webhookBaseUrl) {
            webhookUrl = `${webhookBaseUrl}/api/platforms/telegram/webhook/${integrationId}`;
            const webhookResult = await telegram.setWebhook(webhookUrl, webhookSecret);

            if (!webhookResult.success) {
                return res.status(400).json({
                    error: 'Failed to set webhook',
                    details: webhookResult.error
                });
            }
        }

        // Store in database
        const stmt = db.prepare(`
      INSERT INTO platform_integrations (
        id, user_id, platform, name, status,
        bot_token, webhook_url, webhook_secret,
        telegram_bot_id, telegram_bot_username
      ) VALUES ($1, $2, 'telegram', $3, 'connected', $4, $5, $6, $7, $8)
    `);

        await stmt.run(
            integrationId,
            userId,
            `@${validation.botInfo!.username}`,
            botToken,
            webhookUrl,
            webhookSecret,
            String(validation.botInfo!.id),
            validation.botInfo!.username
        );

        res.json({
            success: true,
            integration: {
                id: integrationId,
                platform: 'telegram',
                name: `@${validation.botInfo!.username}`,
                botUsername: validation.botInfo!.username,
                botId: validation.botInfo!.id,
                webhookUrl,
                status: 'connected'
            }
        });
    } catch (error: any) {
        console.error('Telegram setup error:', error);
        res.status(500).json({ error: 'Failed to setup Telegram integration' });
    }
});

/**
 * POST /api/platforms/telegram/webhook/:integrationId
 * Receive updates from Telegram
 */
router.post('/telegram/webhook/:integrationId', async (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];

        // Find integration
        const integration: any = await db.prepare(
            'SELECT * FROM platform_integrations WHERE id = $1 AND platform = $2'
        ).get(integrationId, 'telegram');

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // Verify secret token
        if (integration.webhook_secret && secretToken !== integration.webhook_secret) {
            return res.status(403).json({ error: 'Invalid secret token' });
        }

        const telegram = new TelegramIntegration(integration.bot_token);
        const update = telegram.processUpdate(req.body);

        if (update.type === 'message' && update.text && update.chatId) {
            // Store incoming message
            const messageId = uuid();
            await db.prepare(`
        INSERT INTO messages (
          id, integration_id, platform, direction, chat_id,
          user_id_external, username, message_text, platform_message_id
        ) VALUES ($1, $2, 'telegram', 'incoming', $3, $4, $5, $6, $7)
      `).run(
                messageId,
                integrationId,
                String(update.chatId),
                update.userId ? String(update.userId) : null,
                update.username,
                update.text,
                update.messageId ? String(update.messageId) : null
            );

            // Find active bot for user
            // In a real multi-bot scenario, we might router based on context or user selection
            // For now, we pick the most recently updated active bot
            const activeBot = await db.prepare(`
                SELECT * FROM bots 
                WHERE user_id = $1 AND status = 'active' 
                ORDER BY updated_at DESC LIMIT 1
            `).get(integration.user_id) as any;

            let responseText = '';

            if (!activeBot) {
                responseText = "⚠️ No active AI assistant found. Please create and deploy a bot from your dashboard.";
            } else {
                try {
                    // Generate AI response
                    // We need to fetch the USER's API keys (not server env) if we want per-user billing
                    // For now, AIService uses server env keys, but we can pass user keys later

                    // Actually, let's just use the server keys for the MVP as the user asked for "guideline for customers how to setup API key"
                    // which means we SHOULD implement per-user keys in AIService.generateResponse
                    // But AIService currently takes (userId, botId, prompt) and expects internally to handle keys.
                    // We'll update AIService later to fetch user keys.

                    responseText = await aiService.generateResponse(
                        integration.user_id,
                        activeBot.id,
                        update.text,
                        integration.id
                    );
                } catch (err: any) {
                    console.error('AI Processing Error:', err);
                    responseText = "⚠️ I'm having trouble thinking right now. Please try again later.";
                }
            }

            const sentMessage = await telegram.sendMessage(update.chatId, responseText);

            // Store outgoing message
            await db.prepare(`
        INSERT INTO messages (
          id, integration_id, platform, direction, chat_id,
          message_text, platform_message_id, status
        ) VALUES ($1, $2, 'telegram', 'outgoing', $3, $4, $5, 'sent')
      `).run(
                uuid(),
                integrationId,
                String(update.chatId),
                responseText,
                String(sentMessage.message_id)
            );
        }

        // Always respond with 200 to acknowledge receipt
        res.sendStatus(200);
    } catch (error: any) {
        console.error('Telegram webhook error:', error);
        res.sendStatus(200); // Still acknowledge to prevent retries
    }
});

/**
 * POST /api/platforms/telegram/:integrationId/send
 * Send a message via Telegram
 */
router.post('/telegram/:integrationId/send', async (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;
        const { chatId, text } = req.body;
        const userId = (req as any).userId;

        // Find integration
        const integration: any = await db.prepare(
            'SELECT * FROM platform_integrations WHERE id = $1 AND user_id = $2 AND platform = $3'
        ).get(integrationId, userId, 'telegram');

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        const telegram = new TelegramIntegration(integration.bot_token);
        const sentMessage = await telegram.sendMessage(chatId, text);

        // Store outgoing message
        await db.prepare(`
      INSERT INTO messages (
        id, integration_id, platform, direction, chat_id,
        message_text, platform_message_id, status
      ) VALUES ($1, $2, 'telegram', 'outgoing', $3, $4, $5, 'sent')
    `).run(
            uuid(),
            integrationId,
            String(chatId),
            text,
            String(sentMessage.message_id)
        );

        res.json({ success: true, messageId: sentMessage.message_id });
    } catch (error: any) {
        console.error('Telegram send error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// WHATSAPP ROUTES
// ============================================

/**
 * POST /api/platforms/whatsapp/setup
 * Validate credentials and create WhatsApp integration
 */
router.post('/whatsapp/setup', async (req: Request, res: Response) => {
    try {
        const { phoneNumberId, accessToken, businessAccountId, verifyToken } = req.body;
        const userId = (req as any).userId;

        if (!phoneNumberId || !accessToken) {
            return res.status(400).json({ error: 'Phone Number ID and Access Token are required' });
        }

        // Validate credentials
        const whatsapp = new WhatsAppIntegration({
            phoneNumberId,
            accessToken,
            businessAccountId: businessAccountId || '',
            verifyToken: verifyToken || uuid()
        });

        const validation = await whatsapp.validateCredentials();

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid WhatsApp credentials',
                details: validation.error
            });
        }

        // Store in database
        const integrationId = uuid();
        const finalVerifyToken = verifyToken || uuid();

        await db.prepare(`
      INSERT INTO platform_integrations (
        id, user_id, platform, name, status,
        whatsapp_phone_number_id, whatsapp_access_token,
        whatsapp_business_account_id, whatsapp_verify_token, whatsapp_display_number
      ) VALUES ($1, $2, 'whatsapp', $3, 'connected', $4, $5, $6, $7, $8)
    `).run(
            integrationId,
            userId,
            `WhatsApp: ${validation.phoneNumber}`,
            phoneNumberId,
            accessToken,
            businessAccountId || null,
            finalVerifyToken,
            validation.phoneNumber
        );

        res.json({
            success: true,
            integration: {
                id: integrationId,
                platform: 'whatsapp',
                name: `WhatsApp: ${validation.phoneNumber}`,
                phoneNumber: validation.phoneNumber,
                verifyToken: finalVerifyToken,
                webhookUrl: `/api/platforms/whatsapp/webhook/${integrationId}`,
                status: 'connected'
            }
        });
    } catch (error: any) {
        console.error('WhatsApp setup error:', error);
        res.status(500).json({ error: 'Failed to setup WhatsApp integration' });
    }
});

/**
 * GET /api/platforms/whatsapp/webhook/:integrationId
 * Verify webhook with Meta
 */
router.get('/whatsapp/webhook/:integrationId', (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        // Find integration
        const integration: any = db.prepare(
            'SELECT * FROM platform_integrations WHERE id = ? AND platform = ?'
        ).get(integrationId, 'whatsapp');

        if (!integration) {
            return res.status(404).send('Integration not found');
        }

        // Verify token
        if (mode === 'subscribe' && token === integration.whatsapp_verify_token) {
            console.log('WhatsApp webhook verified for:', integrationId);
            return res.status(200).send(challenge);
        }

        res.status(403).send('Verification failed');
    } catch (error: any) {
        console.error('WhatsApp webhook verification error:', error);
        res.status(500).send('Internal error');
    }
});

/**
 * POST /api/platforms/whatsapp/webhook/:integrationId
 * Receive messages from WhatsApp
 */
router.post('/whatsapp/webhook/:integrationId', async (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;

        // Find integration
        const integration: any = db.prepare(
            'SELECT * FROM platform_integrations WHERE id = ? AND platform = ?'
        ).get(integrationId, 'whatsapp');

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        const whatsapp = new WhatsAppIntegration({
            phoneNumberId: integration.whatsapp_phone_number_id,
            accessToken: integration.whatsapp_access_token,
            businessAccountId: integration.whatsapp_business_account_id || '',
            verifyToken: integration.whatsapp_verify_token
        });

        const updates = whatsapp.processWebhook(req.body);

        for (const update of updates) {
            if (update.type === 'message' && update.text && update.from) {
                // Store incoming message
                const messageId = uuid();
                await db.prepare(`
          INSERT INTO messages (
            id, integration_id, platform, direction, chat_id,
            user_id_external, user_name, message_text, platform_message_id
          ) VALUES ($1, $2, 'whatsapp', 'incoming', $3, $4, $5, $6, $7)
        `).run(
                    messageId,
                    integrationId,
                    update.from,
                    update.from,
                    update.name,
                    update.text,
                    update.messageId
                );

                // Mark as read
                if (update.messageId) {
                    await whatsapp.markAsRead(update.messageId);
                }

                // Find active bot
                const activeBot = await db.prepare(`
                    SELECT * FROM bots 
                    WHERE user_id = $1 AND status = 'active' 
                    ORDER BY updated_at DESC LIMIT 1
                `).get(integration.user_id) as any;

                let responseText = '';

                if (!activeBot) {
                    responseText = "⚠️ No active AI assistant found. Please deploy a bot.";
                } else {
                    try {
                        responseText = await aiService.generateResponse(
                            integration.user_id,
                            activeBot.id,
                            update.text,
                            integration.id
                        );
                    } catch (err: any) {
                        console.error('AI Processing Error:', err);
                        responseText = "⚠️ System Error: Unable to process request.";
                    }
                }

                const sent = await whatsapp.sendTextMessage(update.from, responseText);

                // Store outgoing message
                await db.prepare(`
          INSERT INTO messages (
            id, integration_id, platform, direction, chat_id,
            message_text, platform_message_id, status
          ) VALUES ($1, $2, 'whatsapp', 'outgoing', $3, $4, $5, 'sent')
        `).run(
                    uuid(),
                    integrationId,
                    update.from,
                    responseText,
                    sent.messageId
                );
            }
        }

        // Always respond with 200
        res.sendStatus(200);
    } catch (error: any) {
        console.error('WhatsApp webhook error:', error);
        res.sendStatus(200);
    }
});

// ============================================
// COMMON ROUTES
// ============================================

/**
 * GET /api/platforms
 * Get all integrations for the current user
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const integrations = await db.prepare(`
      SELECT 
        id, platform, name, status, webhook_url,
        telegram_bot_username, whatsapp_display_number,
        created_at, updated_at
      FROM platform_integrations 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `).all(userId);

        res.json(integrations);
    } catch (error: any) {
        console.error('Get integrations error:', error);
        res.status(500).json({ error: 'Failed to get integrations' });
    }
});

/**
 * DELETE /api/platforms/:integrationId
 * Delete an integration
 */
router.delete('/:integrationId', async (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;
        const userId = (req as any).userId;

        // Find integration
        const integration: any = await db.prepare(
            'SELECT * FROM platform_integrations WHERE id = $1 AND user_id = $2'
        ).get(integrationId, userId);

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // Delete webhook if Telegram
        if (integration.platform === 'telegram' && integration.bot_token) {
            const telegram = new TelegramIntegration(integration.bot_token);
            await telegram.deleteWebhook();
        }

        // Delete from database (messages will cascade delete)
        await db.prepare('DELETE FROM platform_integrations WHERE id = $1').run(integrationId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete integration error:', error);
        res.status(500).json({ error: 'Failed to delete integration' });
    }
});

/**
 * GET /api/platforms/:integrationId/messages
 * Get message history for an integration
 */
router.get('/:integrationId/messages', async (req: Request, res: Response) => {
    try {
        const { integrationId } = req.params;
        const userId = (req as any).userId;
        const limit = parseInt(req.query.limit as string) || 50;

        // Verify ownership
        const integration = await db.prepare(
            'SELECT id FROM platform_integrations WHERE id = $1 AND user_id = $2'
        ).get(integrationId, userId);

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        const messages = await db.prepare(`
      SELECT * FROM messages 
      WHERE integration_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `).all(integrationId, limit);

        res.json(messages);
    } catch (error: any) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

export default router;
