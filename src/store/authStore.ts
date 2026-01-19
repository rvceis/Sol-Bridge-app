/**
 * Solar Energy Sharing Platform - Auth Store
 * Manages authentication state with Zustand
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  // State
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isOnboarded: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setOnboarded: (value: boolean) => void;
  resetProfileSelection: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      status: 'idle',
      error: null,
      isOnboarded: false,

      // Login
      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ status: 'loading', error: null });

        try {
          const response = await authService.login(credentials);

          if (response.success && response.data) {
            set({
              user: response.data.user,
              status: 'authenticated',
              error: null,
            });
            return true;
          } else {
            set({
              status: 'unauthenticated',
              error: response.message || 'Login failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            status: 'unauthenticated',
            error: error.message || 'An error occurred during login',
          });
          return false;
        }
      },

      // Register
      register: async (data: RegisterRequest): Promise<boolean> => {
        set({ status: 'loading', error: null });

        try {
          const response = await authService.register(data);

          if (response.success && response.data) {
            set({
              user: response.data.user,
              status: 'authenticated',
              error: null,
            });
            return true;
          } else {
            set({
              status: 'unauthenticated',
              error: response.message || 'Registration failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            status: 'unauthenticated',
            error: error.message || 'An error occurred during registration',
          });
          return false;
        }
      },

      // Logout
      logout: async (): Promise<void> => {
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            status: 'unauthenticated',
            error: null,
            // Reset onboarding so user can re-select profile after logout
            isOnboarded: false,
          });
        }
      },

      // Force user to re-select profile/onboarding
      resetProfileSelection: async (): Promise<void> => {
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            status: 'unauthenticated',
            error: null,
            isOnboarded: false,
          });
        }
      },

      // Refresh auth (check if tokens are valid)
      refreshAuth: async (): Promise<boolean> => {
        try {
          const response = await authService.refreshToken();

          if (response.success && response.data) {
            set({
              user: response.data.user,
              status: 'authenticated',
            });
            return true;
          }
          return false;
        } catch {
          set({ status: 'unauthenticated' });
          return false;
        }
      },

      // Update user profile
      updateUser: async (userData: Partial<User>): Promise<boolean> => {
        try {
          const response = await authService.updateProfile(userData);

          if (response.success && response.data) {
            set({ user: response.data });
            return true;
          }
          return false;
        } catch (error: any) {
          set({ error: error.message || 'Failed to update profile' });
          return false;
        }
      },

      // Set user directly (for manual updates)
      setUser: (user: User | null) => {
        set({ user });
      },

      // Set onboarded status
      setOnboarded: (value: boolean) => {
        set({ isOnboarded: value });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Check auth status on app start
      checkAuthStatus: async (): Promise<void> => {
        try {
          const isAuth = await authService.isAuthenticated();

          if (isAuth) {
            const user = await authService.getStoredUser();
            if (user) {
              // Immediately set authenticated with cached user data
              // This shows the app instantly without waiting for API
              set({
                user,
                status: 'authenticated',
              });

              // Refresh profile from server in background (non-blocking)
              // This updates the user data if anything changed
              authService.getProfile()
                .then((profileResponse) => {
                  if (profileResponse.success && profileResponse.data) {
                    set({ user: profileResponse.data });
                  }
                })
                .catch(() => {
                  // Silently fail - we already have cached data
                  console.log('[Auth] Background profile refresh failed, using cached data');
                });
            } else {
              set({ status: 'unauthenticated' });
            }
          } else {
            set({ status: 'unauthenticated' });
          }
        } catch {
          set({ status: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        // Don't persist user data here - it's in SecureStore
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) =>
  state.status === 'authenticated';
export const selectIsLoading = (state: AuthState) => state.status === 'loading';
export const selectAuthError = (state: AuthState) => state.error;
export const selectIsOnboarded = (state: AuthState) => state.isOnboarded;
export const selectUserRole = (state: AuthState) => state.user?.role;

// Convenience helper to trigger re-onboarding from anywhere
export const resetProfileSelection: () => Promise<void> = () =>
  useAuthStore.getState().resetProfileSelection();
