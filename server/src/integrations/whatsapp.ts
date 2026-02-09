/**
 * WhatsApp Business Cloud API Integration
 * Real integration using Meta's official WhatsApp Cloud API
 */

import axios from 'axios';

const WHATSAPP_API = 'https://graph.facebook.com/v18.0';

export interface WhatsAppCredentials {
    phoneNumberId: string;      // WhatsApp Business Phone Number ID
    accessToken: string;        // Permanent access token from Meta
    businessAccountId: string;  // WhatsApp Business Account ID
    verifyToken: string;        // Webhook verification token (user-defined)
}

export interface WhatsAppMessage {
    from: string;               // Sender phone number
    id: string;                 // Message ID
    timestamp: string;          // Unix timestamp
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction';
    text?: { body: string };
    image?: { id: string; mime_type: string; sha256: string };
}

export interface WhatsAppWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: { name: string };
                    wa_id: string;
                }>;
                messages?: WhatsAppMessage[];
                statuses?: Array<{
                    id: string;
                    status: 'sent' | 'delivered' | 'read' | 'failed';
                    timestamp: string;
                    recipient_id: string;
                }>;
            };
            field: string;
        }>;
    }>;
}

export class WhatsAppIntegration {
    private credentials: WhatsAppCredentials;
    private baseUrl: string;

    constructor(credentials: WhatsAppCredentials) {
        this.credentials = credentials;
        this.baseUrl = `${WHATSAPP_API}/${credentials.phoneNumberId}`;
    }

    /**
     * Validate credentials by checking the phone number
     */
    async validateCredentials(): Promise<{ valid: boolean; phoneNumber?: string; error?: string }> {
        try {
            const response = await axios.get(
                `${WHATSAPP_API}/${this.credentials.phoneNumberId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.credentials.accessToken}`,
                    },
                }
            );

            if (response.data.id) {
                return {
                    valid: true,
                    phoneNumber: response.data.display_phone_number
                };
            }
            return { valid: false, error: 'Unable to verify phone number' };
        } catch (error: any) {
            const message = error.response?.data?.error?.message || error.message;
            return { valid: false, error: message };
        }
    }

    /**
     * Verify webhook (called during Meta webhook setup)
     * Returns the challenge if verification succeeds
     */
    verifyWebhook(
        mode: string,
        token: string,
        challenge: string
    ): { verified: boolean; challenge?: string } {
        if (mode === 'subscribe' && token === this.credentials.verifyToken) {
            return { verified: true, challenge };
        }
        return { verified: false };
    }

    /**
     * Send a text message
     */
    async sendTextMessage(
        to: string,
        text: string,
        options?: {
            previewUrl?: boolean;
        }
    ): Promise<{ messageId: string }> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: {
                        preview_url: options?.previewUrl ?? false,
                        body: text,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.credentials.accessToken}`,
                    },
                }
            );

            return { messageId: response.data.messages[0].id };
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || error.message);
        }
    }

    /**
     * Send a template message (required for initiating conversations)
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string = 'en_US',
        components?: any[]
    ): Promise<{ messageId: string }> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.credentials.accessToken}`,
                    },
                }
            );

            return { messageId: response.data.messages[0].id };
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || error.message);
        }
    }

    /**
     * Mark a message as read
     */
    async markAsRead(messageId: string): Promise<void> {
        try {
            await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.credentials.accessToken}`,
                    },
                }
            );
        } catch (error: any) {
            // Silently ignore read receipt errors
            console.error('Failed to mark message as read:', error.message);
        }
    }

    /**
     * Process incoming webhook payload
     */
    processWebhook(payload: WhatsAppWebhookPayload): Array<{
        type: 'message' | 'status';
        from?: string;
        name?: string;
        text?: string;
        messageId?: string;
        timestamp?: string;
        status?: string;
    }> {
        const results: Array<any> = [];

        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                const value = change.value;

                // Process messages
                if (value.messages) {
                    for (const message of value.messages) {
                        const contact = value.contacts?.find(c => c.wa_id === message.from);
                        results.push({
                            type: 'message',
                            from: message.from,
                            name: contact?.profile?.name,
                            text: message.text?.body,
                            messageId: message.id,
                            timestamp: message.timestamp,
                        });
                    }
                }

                // Process status updates
                if (value.statuses) {
                    for (const status of value.statuses) {
                        results.push({
                            type: 'status',
                            messageId: status.id,
                            status: status.status,
                            timestamp: status.timestamp,
                        });
                    }
                }
            }
        }

        return results;
    }
}

export default WhatsAppIntegration;
