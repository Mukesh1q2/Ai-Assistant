export interface AICompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    userId: string;
    botId?: string;
    history?: { role: string; content: string }[];
}

export interface AIProvider {
    name: string;
    generateResponse(prompt: string, options: AICompletionOptions): Promise<string>;
    validateKey(apiKey: string): Promise<boolean>;
}
