import { AIProvider, AICompletionOptions } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { prisma } from '../../db';

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
  }

  getProvider(name: string): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      // Fallback to openai if configured, else throw
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
    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) throw new Error('Bot not found');

    let providerName = 'openai';
    let modelName = 'gpt-3.5-turbo';

    if (bot.personality?.toLowerCase().includes('gemini') || bot.type === 'gemini') {
      providerName = 'gemini';
      modelName = 'gemini-3.0-flash';
    }

    const provider = this.getProvider(providerName);

    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let response = '';

    try {
      console.log(`🤖 AI: Generating response for bot ${bot.name} using ${providerName} (${modelName})`);
      response = await provider.generateResponse(prompt, {
        userId,
        botId,
        model: modelName,
        temperature: 0.7,
        systemPrompt: bot.personality || '',
      });
      return response;
    } catch (error: any) {
      status = 'failed';
      errorMessage = error.message;
      console.error('AI Generation Warning:', error.message);
      return `(System Error: ${error.message})`;
    } finally {
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
      await prisma.execution.create({
        data: {
          botId,
          userId,
          integrationId,
          status,
          errorMessage: error,
          durationMs: duration,
          cost: 0
        }
      });
    } catch (e) {
      console.error('Failed to log execution:', e);
    }
  }
}

export const aiService = new AIService();
