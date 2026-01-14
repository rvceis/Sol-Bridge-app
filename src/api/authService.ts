/**
 * Solar Energy Sharing Platform - Authentication Service
 * Handles all authentication-related API calls
 */

import { api } from './client';
import { ENDPOINTS, STORAGE_KEYS } from './config';
import { getItem, setItem, deleteItem } from '../utils/storage';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

class AuthService {
  /**
   * Register a new user
   * Transforms frontend format to backend format
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Transform to backend format
    const backendData = {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
      profile: {
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    };
    
    const response = await api.post<AuthResponse>(ENDPOINTS.auth.register, backendData);

    if (response.success && response.data) {
      // Store tokens securely
      await this.storeTokens(response.data.accessToken, response.data.refreshToken);
      // Store user data
      await setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data.user)
      );
    }

    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>(ENDPOINTS.auth.login, data);
      console.log('[Auth] Login response object keys:', Object.keys(response || {}));
      console.log('[Auth] Login response.success:', response?.success);
      console.log('[Auth] Login response.data keys:', Object.keys(response?.data || {}));
      console.log('[Auth] Full response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        // Store tokens securely
        console.log('[Auth] Login successful, storing tokens...');
        console.log('[Auth] response.data.accessToken exists:', !!response.data.accessToken);
        console.log('[Auth] response.data.refreshToken exists:', !!response.data.refreshToken);
        
        await this.storeTokens(response.data.accessToken, response.data.refreshToken);
        console.log('[Auth] Tokens stored successfully');
        
        // Store user data
        await setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data.user)
        );
        console.log('[Auth] User data stored successfully');
      } else {
        console.error('[Auth] Login response was not successful:', response);
      }

      return response;
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ verified: boolean }>> {
    return api.get<{ verified: boolean }>(
      `${ENDPOINTS.auth.verifyEmail}?token=${token}`
    );
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    data: PasswordResetRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>(ENDPOINTS.auth.requestPasswordReset, data);
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    data: PasswordResetConfirm
  ): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>(ENDPOINTS.auth.resetPassword, data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>(ENDPOINTS.auth.refreshToken, {
      refreshToken,
    });

    if (response.success && response.data) {
      await this.storeTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return api.get<User>(ENDPOINTS.users.profile);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put<User>(ENDPOINTS.users.updateProfile, data);

    if (response.success && response.data) {
      // Update stored user data
      await setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data)
      );
    }

    return response;
  }

  /**
   * Logout - Clear all stored data
   */
  async logout(): Promise<void> {
    await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    await deleteItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    const userData = await getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(
    accessToken: string | undefined,
    refreshToken: string | undefined
  ): Promise<void> {
    console.log('[Auth] storeTokens called');
    console.log('[Auth] accessToken param:', !!accessToken, typeof accessToken);
    console.log('[Auth] refreshToken param:', !!refreshToken, typeof refreshToken);
    
    if (!accessToken) {
      console.error('[Auth] ERROR: accessToken is missing or empty!');
      return;
    }
    if (!refreshToken) {
      console.error('[Auth] ERROR: refreshToken is missing or empty!');
      return;
    }
    
    console.log('[Auth] Storing tokens...');
    console.log('[Auth] AccessToken length:', accessToken.length);
    console.log('[Auth] RefreshToken length:', refreshToken.length);
    
    await setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    
    // Verify tokens were stored
    const stored = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.log('[Auth] Token storage verification - refreshToken retrieved:', !!stored);
    if (!stored) {
      console.error('[Auth] CRITICAL: Refresh token not stored!');
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
}

export const authService = new AuthService();
export default authService;
