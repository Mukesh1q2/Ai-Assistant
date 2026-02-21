/**
 * Bot Service
 * 
 * Uses real backend API for bot operations.
 */

import { api, type ApiResponse, type PaginatedResponse } from './api';
import type { Bot } from '@/types';

export interface CreateBotData {
    name: string;
    description: string;
    type: string;
    avatar?: string;
    personality?: string;
    memoryScope?: 'user' | 'family' | 'global';
    modelProvider?: string;
    modelName?: string;
    systemPrompt?: string;
    temperature?: number;
}

export interface UpdateBotData {
    name?: string;
    description?: string;
    avatar?: string;
    status?: Bot['status'];
    personality?: string;
    memoryScope?: 'user' | 'family' | 'global';
    modelProvider?: string;
    modelName?: string;
    systemPrompt?: string;
    temperature?: number;
}

export interface BotFilters {
    status?: Bot['status'];
    search?: string;
    page?: number;
    pageSize?: number;
}

class BotService {
    /**
     * Get all bots
     */
    async getBots(_filters?: BotFilters): Promise<ApiResponse<PaginatedResponse<Bot>>> {
        return api.get<PaginatedResponse<Bot>>('/bots');
    }

    /**
     * Get a single bot by ID
     */
    async getBot(id: string): Promise<ApiResponse<Bot>> {
        return api.get<Bot>(`/bots/${id}`);
    }

    /**
     * Create a new bot
     */
    async createBot(data: CreateBotData): Promise<ApiResponse<Bot>> {
        return api.post<Bot>('/bots', data);
    }

    /**
     * Update an existing bot
     */
    async updateBot(id: string, data: UpdateBotData): Promise<ApiResponse<Bot>> {
        return api.put<Bot>(`/bots/${id}`, data);
    }

    /**
     * Delete a bot
     */
    async deleteBot(id: string): Promise<ApiResponse<void>> {
        return api.delete<void>(`/bots/${id}`);
    }

    /**
     * Deploy a bot
     */
    async deployBot(id: string): Promise<ApiResponse<Bot>> {
        return api.post<Bot>(`/bots/${id}/deploy`);
    }

    /**
     * Start a bot
     */
    async startBot(id: string): Promise<ApiResponse<Bot>> {
        return api.post<Bot>(`/bots/${id}/start`);
    }

    /**
     * Stop a bot
     */
    async stopBot(id: string): Promise<ApiResponse<Bot>> {
        return api.post<Bot>(`/bots/${id}/stop`);
    }
}

export const botService = new BotService();
