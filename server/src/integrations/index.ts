/**
 * Integrations Index
 * Export all platform integrations
 */

export { TelegramIntegration } from './telegram';
export type { TelegramBotInfo, TelegramMessage, TelegramUpdate } from './telegram';

export { WhatsAppIntegration } from './whatsapp';
export type { WhatsAppCredentials, WhatsAppMessage, WhatsAppWebhookPayload } from './whatsapp';
