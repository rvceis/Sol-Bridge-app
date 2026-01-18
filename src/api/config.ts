/**
 * Solar Energy Sharing Platform - API Configuration
 * Centralized API configuration and constants
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get environment variables from Expo Constants (works in React Native)
const getEnvVar = (key: string, defaultValue: string = '') => {
  // For native builds, use Constants.expoConfig.extra
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  // Fallback to process.env for web
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return defaultValue;
};

// Environment - use EXPO_PUBLIC_ENV or default to development
const CURRENT_ENV = getEnvVar('EXPO_PUBLIC_ENV', 'development');

// Backend API URLs - HARDCODED for mobile app reliability
const BACKEND_URLS = {
  // Development (local) - Using Render backend for consistency
  development: {
    base: 'https://sol-bridge.onrender.com',
    mlService: 'http://localhost:8001',
  },
  // Staging
  staging: {
    base: 'https://staging-api.solarsharing.com',
    mlService: 'https://staging-ml.solarsharing.com',
  },
  // Production
  production: {
    base: 'https://sol-bridge.onrender.com',  // Using your deployed backend
    mlService: 'https://ml.solarsharing.com',
  },
};

const getEnvironment = () => {
  if (CURRENT_ENV.includes('prod')) return 'production';
  if (CURRENT_ENV.includes('staging')) return 'staging';
  return 'development';
};

const env = getEnvironment();
const backends = BACKEND_URLS[env];

// Debug logging for mobile apps
console.log('=== API CONFIG DEBUG ===');
console.log('Environment:', env);
console.log('Platform:', Platform.OS);
console.log('Backend Base URL:', backends.base);
console.log('Backend ML URL:', backends.mlService);
console.log('=======================');

// API Base URL - Change this for different environments
export const API_CONFIG = {
  // Development (local)
  development: {
    baseUrl: `${backends.base}/api/v1`,
    mlServiceUrl: `${backends.mlService}/api/v1`,
    timeout: 30000,
  },

  // Staging
  staging: {
    baseUrl: `${backends.base}/api/v1`,
    mlServiceUrl: `${backends.mlService}/api/v1`,
    timeout: 30000,
  },

  // Production
  production: {
    baseUrl: `${backends.base}/api/v1`,
    mlServiceUrl: `${backends.mlService}/api/v1`,
    timeout: 30000,
  },
};

// Export current config
export const API_BASE_URL = API_CONFIG[env].baseUrl;
export const ML_SERVICE_URL = API_CONFIG[env].mlServiceUrl;
export const API_TIMEOUT = API_CONFIG[env].timeout;

// Debug log
console.log('[Config] Environment:', env);
console.log('[Config] API Base URL:', API_BASE_URL);
console.log('[Config] ML Service URL:', ML_SERVICE_URL);
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

  // ML Predictions
  ml: {
    solarForecast: '/predict/solar-generation',
    demandForecast: '/predict/consumption',
    dynamicPricing: '/predict/pricing',
    anomalyDetection: '/predict/anomalies',
    equipmentFailure: '/predict/equipment-failure',
    marketplaceMatching: '/matching/find-matches',
    riskScoring: '/predict/investor-risk',
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
  ML_SERVICE_URL,
  API_TIMEOUT,
  ENDPOINTS,
  STORAGE_KEYS,
  HTTP_STATUS,
};
