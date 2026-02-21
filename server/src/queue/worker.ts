import { Worker, Job } from 'bullmq';
import { connection } from './connection';
import { QUEUE_NAME, IncomingMessageJob } from './index';
import { prisma } from '../db';
import { aiService } from '../services/ai';
import { TelegramIntegration, WhatsAppIntegration } from '../integrations';

export const messageWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<IncomingMessageJob>) => {
        const { integrationId, platform, messageData } = job.data;
        console.log(`[Worker] Processing message for ${platform} integration ${integrationId} (Job ${job.id})`);

        const integration = await prisma.platformIntegration.findUnique({
            where: { id: integrationId }
        });

        if (!integration) {
            throw new Error(`Integration ${integrationId} not found`);
        }

        // 1. Process Update from generic data
        let chatId = '';
        let text = '';
        let messageId: string | null = null;
        let userIdExternal: string | null = null;
        let userName: string | null = null;
        let telegramApi: TelegramIntegration | null = null;
        let whatsappApi: WhatsAppIntegration | null = null;

        if (platform === 'telegram') {
            telegramApi = new TelegramIntegration(integration.botToken as string);
            const update = telegramApi.processUpdate(messageData);
            if (update.type === 'message' && update.text && update.chatId) {
                chatId = String(update.chatId);
                text = update.text;
                messageId = update.messageId ? String(update.messageId) : null;
                userIdExternal = update.userId ? String(update.userId) : null;
                userName = update.username || null;
            } else {
                return; // Nothing to process
            }
        } else if (platform === 'whatsapp') {
            whatsappApi = new WhatsAppIntegration({
                phoneNumberId: integration.whatsappPhoneNumberId as string,
                accessToken: integration.whatsappAccessToken as string,
                businessAccountId: integration.whatsappBusinessAccountId || '',
                verifyToken: integration.whatsappVerifyToken as string
            });
            const updates = whatsappApi.processWebhook(messageData);
            // Assuming we take the first text message
            const textUpdate = updates.find(u => u.type === 'message' && u.text && u.from);
            if (textUpdate && textUpdate.text && textUpdate.from) {
                chatId = textUpdate.from;
                text = textUpdate.text;
                messageId = textUpdate.messageId || null;
                userIdExternal = textUpdate.from;
                userName = textUpdate.name || null;

                if (messageId) {
                    await whatsappApi.markAsRead(messageId);
                }
            } else {
                return; // Nothing to process
            }
        }

        if (!text || !chatId) return;

        // 2. Store incoming message
        await prisma.message.create({
            data: {
                integrationId: integration.id,
                platform: platform,
                direction: 'incoming',
                chatId: chatId,
                userIdExternal: userIdExternal,
                userName: userName,
                messageText: text,
                platformMessageId: messageId,
            }
        });

        // 3. Find active bot for user
        const activeBot = await prisma.bot.findFirst({
            where: {
                userId: integration.userId,
                status: 'active'
            },
            orderBy: { updatedAt: 'desc' }
        });

        let responseText = '';

        if (!activeBot) {
            responseText = "⚠️ No active AI assistant found. Please deploy a bot.";
        } else {
            try {
                responseText = await aiService.generateResponse(
                    integration.userId,
                    activeBot.id,
                    text,
                    integration.id
                );
            } catch (err: any) {
                console.error('[Worker] AI Processing Error:', err);
                // BullMQ error throwing will cause a retry. But we might want to gently inform the user.
                // Depending on the error, maybe retry. For now, we will send an error message instead of failing the job.
                responseText = "⚠️ System Error: I'm having trouble thinking right now. Please try again later.";
            }
        }

        // 4. Send response back
        let sentMessageId: string | null = null;
        if (platform === 'telegram' && telegramApi) {
            const sent = await telegramApi.sendMessage(chatId, responseText);
            sentMessageId = String(sent.message_id);
        } else if (platform === 'whatsapp' && whatsappApi) {
            const sent = await whatsappApi.sendTextMessage(chatId, responseText);
            sentMessageId = sent.messageId || null;
        }

        // 5. Store outgoing message
        await prisma.message.create({
            data: {
                integrationId: integration.id,
                platform: platform,
                direction: 'outgoing',
                chatId: chatId,
                messageText: responseText,
                platformMessageId: sentMessageId,
                status: 'sent'
            }
        });

        console.log(`[Worker] Successfully processed job ${job.id}`);
    },
    {
        connection: connection as any,
        concurrency: 5, // Process 5 messages concurrently
    }
);

messageWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

messageWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed with error ${err.message}`);
});
