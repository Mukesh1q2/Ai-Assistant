import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AICompletionOptions } from './types';

export class GeminiProvider implements AIProvider {
    name = 'gemini';
    private client: GoogleGenerativeAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new GoogleGenerativeAI(apiKey);
        }
    }

    async generateResponse(prompt: string, options: AICompletionOptions): Promise<string> {
        if (!this.client) throw new Error('Gemini API Key not configured');

        try {
            const model = this.client.getGenerativeModel({
                model: options.model || 'gemini-1.5-pro'
            });

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: `System Instruction: ${options.systemPrompt || 'You are a helpful AI assistant.'}` }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Understood. I will follow that instruction.' }],
                    }
                ],
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                },
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Gemini Error:', error);
            throw new Error(`Gemini Error: ${error.message}`);
        }
    }

    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const testClient = new GoogleGenerativeAI(apiKey);
            const model = testClient.getGenerativeModel({ model: 'gemini-pro' });
            await model.generateContent('test');
            return true;
        } catch (error) {
            return false;
        }
    }
}
