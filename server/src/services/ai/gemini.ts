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

            // Use native system instructions
            if (options.systemPrompt) {
                config.systemInstruction = options.systemPrompt;
            }

            const response = await this.client.models.generateContent({
                model: options.model || 'gemini-3.0-flash',
                contents: prompt,
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
            const testClient = new GoogleGenAI({ apiKey });
            await testClient.models.generateContent({
                model: 'gemini-3.0-flash',
                contents: 'test'
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}
