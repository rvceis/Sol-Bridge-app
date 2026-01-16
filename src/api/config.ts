/**
 * Solar Energy Sharing Platform - API Configuration
 * Centralized API configuration and constants
 */

import { Platform } from 'react-native';

// Your machine's IP address for physical device testing
const LOCAL_IP = '10.251.149.193';

// Determine correct localhost URL based on platform
const getDevBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api/v1';
  } else if (Platform.OS === 'android') {
    // Use actual IP for physical devices, 10.0.2.2 for emulator
    return `http://${LOCAL_IP}:3000/api/v1`;
  } else {
    return 'http://localhost:3000/api/v1'; // iOS simulator
  }
};

// API Base URL - Change this for different environments
export const API_CONFIG = {
  // Development (local)
  development: {
    baseUrl: getDevBaseUrl(),
    timeout: 30000,
  },

  // Staging
  staging: {
    baseUrl: 'https://staging-api.solarsharing.com/api/v1',
    timeout: 30000,
  },

  // Production
  production: {
    baseUrl: 'https://api.solarsharing.com/api/v1',
    timeout: 30000,
  },
};

// Current environment - check __DEV__ global (React Native/Expo)
let isDev = true;
try {
  // @ts-ignore
  isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
} catch (e) {
  isDev = true;
}

const ENV = isDev ? 'development' : 'production';

// Export current config
export const API_BASE_URL = API_CONFIG[ENV].baseUrl;
export const API_TIMEOUT = API_CONFIG[ENV].timeout;

// Debug log
console.log('[Config] Environment:', ENV);
console.log('[Config] API Base URL:', API_BASE_URL);
console.log('[Config] Platform:', Platform.OS);

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    verifyEmail: '/auth/verify-email',
    requestPasswordReset: '/auth/password-reset-request',
    resetPassword: '/auth/password-reset',
    refreshToken: '/auth/refresh-token',
  },

  // User Profile
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },

  // IoT & Energy Data
  iot: {
    ingest: '/iot/ingest',
    latest: '/iot/latest',
    history: '/iot/history',
    deviceCommand: '/iot/device-command',
    registerDevice: '/iot/devices',
  },

  // Wallet & Transactions
  wallet: {
    balance: '/wallet',
    transactions: '/transactions',
    topup: '/wallet/topup',
    withdraw: '/wallet/withdraw',
    paymentCallback: '/payment/callback',
  },

  // Admin
  admin: {
    metrics: '/admin/metrics',
  },

  // Health
  health: '/health',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  DEVICE_ID: 'device_id',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
};

// Test connectivity to backend
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('[Config] Testing connection to:', API_BASE_URL);
    const response = await fetch(API_BASE_URL.replace('/api/v1', '') + '/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('[Config] Connection test status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('[Config] Connection test failed:', error);
    return false;
  }
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  ENDPOINTS,
  STORAGE_KEYS,
  HTTP_STATUS,
};
