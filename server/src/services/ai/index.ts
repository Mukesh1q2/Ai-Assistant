import { AIProvider, AICompletionOptions } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { db } from '../../db';

export class AIService {
    private providers: Map<string, AIProvider> = new Map();

    constructor() {
        // Initialize with server-level keys if available
        if (process.env.OPENAI_API_KEY) {
            this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
        }
        if (process.env.GEMINI_API_KEY) {
            this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
        }
        // Anthropic, Ollama can be added here
    }

    getProvider(name: string): AIProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            // Fallback to OpenAI if configured, else throw
            if (this.providers.has('openai')) return this.providers.get('openai')!;
            throw new Error(`Provider ${name} not configured`);
        }
        return provider;
    }

    async generateResponse(
        userId: string,
        botId: string,
        prompt: string,
        integrationId?: string
    ): Promise<string> {
        // Fetch bot config
        const bot = await db.prepare('SELECT * FROM bots WHERE id = $1').get(botId) as any;

        if (!bot) throw new Error('Bot not found');

        const providerName = bot.model_provider || 'openai';
        const provider = this.getProvider(providerName);

        const startTime = Date.now();
        let status = 'success';
        let errorMessage = null;
        let response = '';

        try {
            console.log(`🤖 AI: Generating response for bot ${bot.name} using ${providerName}`);
            response = await provider.generateResponse(prompt, {
                userId,
                botId,
                model: bot.model_name,
                temperature: bot.temperature,
                systemPrompt: bot.system_prompt,
            });
            return response;
        } catch (error: any) {
            status = 'failed';
            errorMessage = error.message;
            console.error('AI Generation Warning:', error.message);
            // Fallback response so user knows what happened
            return `(System Error: ${error.message})`;
        } finally {
            // Log execution for analytics
            const duration = Date.now() - startTime;
            // Async log (fire and forget)
            this.logExecution(botId, userId, integrationId, status, errorMessage, duration);
        }
    }

    private async logExecution(
        botId: string,
        userId: string,
        integrationId: string | undefined,
        status: string,
        error: string | null,
        duration: number
    ) {
        try {
            await db.prepare(`
                INSERT INTO executions (
                    id, bot_id, user_id, integration_id, 
                    status, error_message, duration_ms, cost
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
            `).run(
                'exec-' + Date.now() + Math.random().toString(36).substr(2, 9),
                botId, userId, integrationId || null,
                status, error, duration
            );
        } catch (e) {
            console.error('Failed to log execution:', e);
        }
    }
}

export const aiService = new AIService();
