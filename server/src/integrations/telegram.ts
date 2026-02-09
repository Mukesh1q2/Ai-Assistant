/**
 * Telegram Bot API Integration
 * Real integration with Telegram via BotFather tokens
 */

import axios from 'axios';

const TELEGRAM_API = 'https://api.telegram.org/bot';

export interface TelegramBotInfo {
    id: number;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
}

export interface TelegramMessage {
    message_id: number;
    from: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
    };
    chat: {
        id: number;
        type: 'private' | 'group' | 'supergroup' | 'channel';
        title?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
    };
    date: number;
    text?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
    callback_query?: {
        id: string;
        from: TelegramMessage['from'];
        message?: TelegramMessage;
        data?: string;
    };
}

export class TelegramIntegration {
    private token: string;
    private baseUrl: string;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `${TELEGRAM_API}${token}`;
    }

    /**
     * Validate the bot token by getting bot info
     */
    async validateToken(): Promise<{ valid: boolean; botInfo?: TelegramBotInfo; error?: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/getMe`);
            if (response.data.ok) {
                return { valid: true, botInfo: response.data.result };
            }
            return { valid: false, error: 'Invalid response from Telegram' };
        } catch (error: any) {
            const message = error.response?.data?.description || error.message;
            return { valid: false, error: message };
        }
    }

    /**
     * Set webhook URL for receiving updates
     */
    async setWebhook(webhookUrl: string, secretToken?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const params: any = { url: webhookUrl };
            if (secretToken) {
                params.secret_token = secretToken;
            }

            const response = await axios.post(`${this.baseUrl}/setWebhook`, params);
            if (response.data.ok) {
                return { success: true };
            }
            return { success: false, error: response.data.description };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.description || error.message };
        }
    }

    /**
     * Delete webhook (switch to polling mode)
     */
    async deleteWebhook(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
            if (response.data.ok) {
                return { success: true };
            }
            return { success: false, error: response.data.description };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.description || error.message };
        }
    }

    /**
     * Get current webhook info
     */
    async getWebhookInfo(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
            return response.data.result;
        } catch (error: any) {
            throw new Error(error.response?.data?.description || error.message);
        }
    }

    /**
     * Send a text message
     */
    async sendMessage(
        chatId: number | string,
        text: string,
        options?: {
            parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
            replyToMessageId?: number;
            disableNotification?: boolean;
        }
    ): Promise<TelegramMessage> {
        try {
            const params: any = {
                chat_id: chatId,
                text,
            };

            if (options?.parseMode) params.parse_mode = options.parseMode;
            if (options?.replyToMessageId) params.reply_to_message_id = options.replyToMessageId;
            if (options?.disableNotification) params.disable_notification = options.disableNotification;

            const response = await axios.post(`${this.baseUrl}/sendMessage`, params);
            return response.data.result;
        } catch (error: any) {
            throw new Error(error.response?.data?.description || error.message);
        }
    }

    /**
     * Process incoming webhook update
     */
    processUpdate(update: TelegramUpdate): {
        type: 'message' | 'edited_message' | 'callback_query' | 'unknown';
        chatId?: number;
        userId?: number;
        username?: string;
        text?: string;
        messageId?: number;
    } {
        if (update.message) {
            return {
                type: 'message',
                chatId: update.message.chat.id,
                userId: update.message.from.id,
                username: update.message.from.username,
                text: update.message.text,
                messageId: update.message.message_id,
            };
        }

        if (update.edited_message) {
            return {
                type: 'edited_message',
                chatId: update.edited_message.chat.id,
                userId: update.edited_message.from.id,
                username: update.edited_message.from.username,
                text: update.edited_message.text,
                messageId: update.edited_message.message_id,
            };
        }

        if (update.callback_query) {
            return {
                type: 'callback_query',
                chatId: update.callback_query.message?.chat.id,
                userId: update.callback_query.from.id,
                username: update.callback_query.from.username,
                text: update.callback_query.data,
            };
        }

        return { type: 'unknown' };
    }
}

export default TelegramIntegration;
