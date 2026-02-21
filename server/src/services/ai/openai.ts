import OpenAI from 'openai';
import { AIProvider, AICompletionOptions } from './types';

export class OpenAIProvider implements AIProvider {
    name = 'openai';
    private client: OpenAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        }
    }

    async generateResponse(prompt: string, options: AICompletionOptions): Promise<string> {
        if (!this.client) throw new Error('OpenAI API Key not configured');

        try {
            // Build messages array with conversation history
            const messages: OpenAI.ChatCompletionMessageParam[] = [
                { role: 'system', content: options.systemPrompt || 'You are a helpful AI assistant.' },
            ];

            // Append conversation history for multi-turn context
            if (options.history && options.history.length > 0) {
                for (const msg of options.history) {
                    messages.push({
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                    });
                }
            }

            // Append the current user prompt
            messages.push({ role: 'user', content: prompt });

            const completion = await this.client.chat.completions.create({
                model: options.model || 'gpt-4o',
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000,
                user: options.userId
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error('OpenAI Error:', error);
            throw new Error(`OpenAI Error: ${error.message}`);
        }
    }

    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const testClient = new OpenAI({ apiKey });
            await testClient.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }
}
