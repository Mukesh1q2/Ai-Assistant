/**
 * Authentication Service
 * 
 * Uses real backend API for authentication.
 */

import { api, setAuthToken, clearAuthToken, type ApiResponse } from './api';
import type { User } from '@/types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

class AuthService {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);

        if (response.success && response.data.token) {
            setAuthToken(response.data.token);
        }

        return response;
    }

    /**
     * Register a new user
     */
    async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post<AuthResponse>('/auth/signup', data);

        if (response.success && response.data.token) {
            setAuthToken(response.data.token);
        }

        return response;
    }

    /**
     * Logout current user
     */
    async logout(): Promise<ApiResponse<void>> {
        try {
            await api.post<void>('/auth/logout');
        } catch {
            // Ignore errors on logout
        }

        clearAuthToken();

        return { success: true, data: undefined };
    }

    /**
     * Get current user profile
     */
    async getCurrentUser(): Promise<ApiResponse<User>> {
        return api.get<User>('/auth/me');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    }

    /**
     * Seed demo account (for initial setup)
     */
    async seedDemoAccount(adminKey?: string): Promise<ApiResponse<{ credentials: { email: string; password: string } }>> {
        return api.post('/seed', { adminKey });
    }
}

export const authService = new AuthService();
