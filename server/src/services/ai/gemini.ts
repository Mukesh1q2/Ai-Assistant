import { GoogleGenAI } from '@google/genai';
import { AIProvider, AICompletionOptions } from './types';

export class GeminiProvider implements AIProvider {
    name = 'gemini';
    private client: GoogleGenAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new GoogleGenAI({ apiKey });
        }
    }

    async generateResponse(prompt: string, options: AICompletionOptions): Promise<string> {
        if (!this.client) throw new Error('Gemini API Key not configured');

        try {
            const config: any = {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 1000,
            };

            if (options.systemPrompt) {
                config.systemInstruction = options.systemPrompt;
            }

            // Build contents with conversation history for multi-turn
            let contents: any;
            if (options.history && options.history.length > 0) {
                contents = [
                    ...options.history.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    })),
                    { role: 'user', parts: [{ text: prompt }] },
                ];
            } else {
                contents = prompt;
            }

            const response = await this.client.models.generateContent({
                model: options.model || 'gemini-2.0-flash',
                contents,
                config
            });

            return response.text || '';
        } catch (error: any) {
            console.error('Gemini Error:', error);
            throw new Error(`Gemini Error: ${error.message}`);
        }
    }

    async validateKey(apiKey: string): Promise<boolean> {
        try {
            // Use models.list() instead of generateContent to avoid billable API calls
            const testClient = new GoogleGenAI({ apiKey });
            await testClient.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }
}
