/**
 * Platform Integration Routes
 * Handles Telegram and WhatsApp setup, webhooks, and messaging
 * Refactored to Prisma ORM + PostgreSQL natively
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../db';
import { TelegramIntegration, WhatsAppIntegration } from '../integrations/index.js';
import { aiService } from '../services/ai';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { enqueueMessage } from '../queue';

const router = Router();

// ============================================
// TELEGRAM ROUTES
// ============================================

/**
 * POST /api/platforms/telegram/setup
 * Validate token and create Telegram integration
 */
router.post('/telegram/setup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { botToken, webhookBaseUrl } = req.body;
    const userId = req.userId as string;

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

    const webhookSecret = uuid();
    const integrationId = uuid(); // Predictable ID to construct the webhook URL before saving

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
    const integration = await prisma.platformIntegration.create({
      data: {
        id: integrationId,
        userId: userId,
        platform: 'telegram',
        name: `@${validation.botInfo!.username}`,
        status: 'connected',
        botToken: botToken,
        webhookUrl: webhookUrl,
        webhookSecret: webhookSecret,
        telegramBotId: String(validation.botInfo!.id),
        telegramBotUsername: validation.botInfo!.username
      }
    });

    res.json({
      success: true,
      integration: {
        id: integration.id,
        platform: 'telegram',
        name: integration.name,
        botUsername: integration.telegramBotUsername,
        botId: integration.telegramBotId,
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
 * Receive updates from Telegram.
 * Note: this is a PUBLIC endpoint (no authMiddleware) because Telegram hits it.
 */
router.post('/telegram/webhook/:integrationId', async (req: Request, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.platform !== 'telegram') {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (integration.webhookSecret && secretToken !== integration.webhookSecret) {
      return res.status(403).json({ error: 'Invalid secret token' });
    }

    await enqueueMessage({
      integrationId: integration.id,
      platform: 'telegram',
      messageData: req.body
    });

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
router.post('/telegram/:integrationId/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;
    const { chatId, text } = req.body;
    const userId = req.userId as string;

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.userId !== userId || integration.platform !== 'telegram') {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const telegram = new TelegramIntegration(integration.botToken as string);
    const sentMessage = await telegram.sendMessage(chatId, text);

    await prisma.message.create({
      data: {
        integrationId: integration.id,
        platform: 'telegram',
        direction: 'outgoing',
        chatId: String(chatId),
        messageText: text,
        platformMessageId: String(sentMessage.message_id),
        status: 'sent'
      }
    });

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
 */
router.post('/whatsapp/setup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumberId, accessToken, businessAccountId, verifyToken } = req.body;
    const userId = req.userId as string;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: 'Phone Number ID and Access Token are required' });
    }

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

    const integrationId = uuid();
    const finalVerifyToken = verifyToken || uuid();

    const integration = await prisma.platformIntegration.create({
      data: {
        id: integrationId,
        userId: userId,
        platform: 'whatsapp',
        name: `WhatsApp: ${validation.phoneNumber}`,
        status: 'connected',
        whatsappPhoneNumberId: phoneNumberId,
        whatsappAccessToken: accessToken,
        whatsappBusinessAccountId: businessAccountId || null,
        whatsappVerifyToken: finalVerifyToken,
        whatsappDisplayNumber: validation.phoneNumber
      }
    });

    res.json({
      success: true,
      integration: {
        id: integration.id,
        platform: 'whatsapp',
        name: integration.name,
        phoneNumber: integration.whatsappDisplayNumber,
        verifyToken: integration.whatsappVerifyToken,
        webhookUrl: `/ api / platforms / whatsapp / webhook / ${integration.id}`,
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
 * Verify webhook with Meta (Public endpoint)
 */
router.get('/whatsapp/webhook/:integrationId', async (req: Request, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.platform !== 'whatsapp') {
      return res.status(404).send('Integration not found');
    }

    if (mode === 'subscribe' && token === integration.whatsappVerifyToken) {
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
 * Receive messages from WhatsApp (Public endpoint)
 */
router.post('/whatsapp/webhook/:integrationId', async (req: Request, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.platform !== 'whatsapp') {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await enqueueMessage({
      integrationId: integration.id,
      platform: 'whatsapp',
      messageData: req.body
    });

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
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;

    const integrations = await prisma.platformIntegration.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

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
router.delete('/:integrationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;
    const userId = req.userId as string;

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.userId !== userId) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (integration.platform === 'telegram' && integration.botToken) {
      const telegram = new TelegramIntegration(integration.botToken);
      await telegram.deleteWebhook();
    }

    await prisma.platformIntegration.delete({
      where: { id: integrationId }
    });

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
router.get('/:integrationId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const integrationId = req.params.integrationId as string;
    const userId = req.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.userId !== userId) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const messages = await prisma.message.findMany({
      where: { integrationId: integrationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

export default router;
