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
      throw new Error(`AI provider "${name}" not configured. Please set the appropriate API key.`);
    }
    return provider;
  }

  /**
   * Load a user's per-user API key and create a temporary provider instance
   */
  private async getProviderForUser(userId: string, providerName: string): Promise<AIProvider> {
    // First check if a server-level provider exists
    if (this.providers.has(providerName)) {
      return this.providers.get(providerName)!;
    }

    // Otherwise, try to load from the user's stored keys
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { openaiApiKey: true, geminiApiKey: true, anthropicApiKey: true }
    });

    if (!user) throw new Error('User not found');

    if (providerName === 'openai' && user.openaiApiKey) {
      return new OpenAIProvider(user.openaiApiKey);
    }
    if (providerName === 'gemini' && user.geminiApiKey) {
      return new GeminiProvider(user.geminiApiKey);
    }

    throw new Error(`AI provider "${providerName}" not configured. Please add your API key in Settings.`);
  }

  /**
   * Fetch recent conversation history for context
   */
  private async getConversationHistory(integrationId: string, chatId: string, limit: number = 10): Promise<{ role: string; content: string }[]> {
    if (!integrationId) return [];

    try {
      const messages = await prisma.message.findMany({
        where: {
          integrationId,
          chatId,
          messageText: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { direction: true, messageText: true }
      });

      // Reverse to chronological order and map to chat format
      return messages.reverse().map(m => ({
        role: m.direction === 'incoming' ? 'user' : 'assistant',
        content: m.messageText || '',
      }));
    } catch {
      return [];
    }
  }

  async generateResponse(
    userId: string,
    botId: string,
    prompt: string,
    integrationId?: string,
    chatId?: string
  ): Promise<string> {
    // Fetch bot config
    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) throw new Error('Bot not found');

    // Use explicit modelProvider from bot config — no fragile string matching
    const providerName = bot.modelProvider || 'openai';
    const modelName = bot.modelName || 'gpt-4o';

    const provider = await this.getProviderForUser(userId, providerName);

    // Build conversation history
    const history = integrationId && chatId
      ? await this.getConversationHistory(integrationId, chatId)
      : [];

    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let response = '';

    try {
      console.log(`🤖 AI: Generating response for bot "${bot.name}" using ${providerName}/${modelName}`);
      response = await provider.generateResponse(prompt, {
        userId,
        botId,
        model: modelName,
        temperature: bot.temperature ?? 0.7,
        systemPrompt: bot.systemPrompt || bot.personality || '',
        history,
      });
      return response;
    } catch (error: any) {
      status = 'error';
      errorMessage = error.message;
      console.error('AI Generation Error:', error.message);
      throw error; // Let caller handle the error
    } finally {
      const duration = Date.now() - startTime;
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
