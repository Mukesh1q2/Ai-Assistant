/**
 * Services Index
 * Central export point for all API services
 */

// API utilities
export { api, ApiError, apiRequest, setAuthToken, clearAuthToken, API_CONFIG } from './api';
export type { ApiResponse, PaginatedResponse } from './api';

// Auth Service
export { authService } from './auth.service';
export type { LoginCredentials, SignupData, AuthResponse } from './auth.service';

// Bot Service
export { botService } from './bot.service';
export type { CreateBotData, UpdateBotData, BotFilters } from './bot.service';

// Channel Service
export { channelService } from './channel.service';
export type { CreateChannelData, UpdateChannelData } from './channel.service';
