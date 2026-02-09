/**
 * Channel Service
 * 
 * Uses real backend API for channel operations.
 */

import { api, type ApiResponse, type PaginatedResponse } from './api';
import type { Channel, ChannelType } from '@/types';

export interface CreateChannelData {
    type: ChannelType;
    name: string;
    token?: string;
    webhook?: string;
    guildId?: string;
    channelId?: string;
    phoneNumber?: string;
}

export interface UpdateChannelData {
    name?: string;
    token?: string;
    webhook?: string;
    status?: Channel['status'];
}

class ChannelService {
    /**
     * Get all channels
     */
    async getChannels(): Promise<ApiResponse<PaginatedResponse<Channel>>> {
        return api.get<PaginatedResponse<Channel>>('/channels');
    }

    /**
     * Get a single channel by ID
     */
    async getChannel(id: string): Promise<ApiResponse<Channel>> {
        return api.get<Channel>(`/channels/${id}`);
    }

    /**
     * Connect a new channel
     */
    async connectChannel(data: CreateChannelData): Promise<ApiResponse<Channel>> {
        return api.post<Channel>('/channels', data);
    }

    /**
     * Update channel configuration
     */
    async updateChannel(id: string, data: UpdateChannelData): Promise<ApiResponse<Channel>> {
        return api.put<Channel>(`/channels/${id}`, data);
    }

    /**
     * Disconnect a channel
     */
    async disconnectChannel(id: string): Promise<ApiResponse<void>> {
        return api.delete<void>(`/channels/${id}`);
    }

    /**
     * Reconnect a channel
     */
    async reconnectChannel(id: string): Promise<ApiResponse<Channel>> {
        return api.post<Channel>(`/channels/${id}/reconnect`);
    }

    /**
     * Get supported channel types
     */
    async getSupportedTypes(): Promise<ApiResponse<ChannelType[]>> {
        return api.get<ChannelType[]>('/channels/types/list');
    }
}

export const channelService = new ChannelService();
