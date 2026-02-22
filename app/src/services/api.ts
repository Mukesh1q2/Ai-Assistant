/**
 * API Client Configuration and Base Utilities
 * 
 * Connects to the real backend API.
 */


// API Configuration
export const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
};

// API Response Types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Error Types
export class ApiError extends Error {
    statusCode: number;
    code?: string;

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

// Auth token helpers — with httpOnly cookies, the browser manages the token.
// These are kept for backward compatibility but are no longer the primary mechanism.
function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
    // Store as fallback for non-cookie scenarios
    localStorage.setItem('auth_token', token);
}

export function clearAuthToken(): void {
    localStorage.removeItem('auth_token');
}

// Generic fetch wrapper with error handling
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Send httpOnly cookies
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.error || 'An error occurred',
                response.status,
                data.code
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            0,
            'NETWORK_ERROR'
        );
    }
}

// HTTP method helpers
export const api = {
    get: <T>(endpoint: string) =>
        apiRequest<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown) =>
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T>(endpoint: string, data: unknown) =>
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    patch: <T>(endpoint: string, data: unknown) =>
        apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string) =>
        apiRequest<T>(endpoint, { method: 'DELETE' }),

    // Settings API
    getSettings: () => api.get<SettingsResponse>('/settings/keys'),
    updateSettings: (data: Partial<SettingsPayload>) => api.put<{ success: boolean; message: string }>('/settings/keys', data),

    // Analytics API
    getAnalytics: (period: string = '30d') => api.get<AnalyticsResponse>(`/analytics?period=${period}`),

    // Bots API — returns { success, data: { data: Bot[], ... } }
    getBots: () => api.get<any>('/bots'),
    getBot: (id: string) => api.get<any>(`/bots/${id}`),
    createBot: (data: Record<string, any>) => api.post<any>('/bots', data),
    updateBot: (id: string, data: Record<string, any>) => api.put<any>(`/bots/${id}`, data),
    deleteBot: (id: string) => api.delete<any>(`/bots/${id}`),
    deployBot: (id: string) => api.post<any>(`/bots/${id}/deploy`),
    startBot: (id: string) => api.post<any>(`/bots/${id}/start`),
    stopBot: (id: string) => api.post<any>(`/bots/${id}/stop`),

    // Channels API — returns { success, data: { data: Channel[], ... } }
    getChannels: () => api.get<any>('/channels'),
    connectChannel: (type: string, config: Record<string, unknown>) => api.post<any>('/channels', { type, config }),
    disconnectChannel: (id: string) => api.delete<any>(`/channels/${id}`),
    updateChannel: (id: string, data: Record<string, unknown>) => api.put<any>(`/channels/${id}`, data),
};

// ——— Response types for typed API methods ———

interface SettingsResponse {
    openai_api_key: string | null;
    gemini_api_key: string | null;
    anthropic_api_key: string | null;
    has_openai: boolean;
    has_gemini: boolean;
    has_anthropic: boolean;
}

interface SettingsPayload {
    openai_api_key: string;
    gemini_api_key: string;
    anthropic_api_key: string;
}

interface AnalyticsResponse {
    executions: {
        total: number;
        successful: number;
        failed: number;
        byDay: Record<string, number>;
        byPack: Record<string, number>;
    };
    channels: {
        total: number;
        active: number;
        messagesReceived: number;
        messagesSent: number;
        byChannel: Record<string, number>;
    };
    bots: {
        total: number;
        active: number;
        uptime: number;
        byBot: Record<string, number>;
    };
    period: string;
}

