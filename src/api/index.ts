/**
 * Solar Energy Sharing Platform - API Index
 * Central export for all API services
 */

// Core API client
export { api } from './client';
export { default as apiClient } from './client';

// Configuration
export { API_BASE_URL, ENDPOINTS, STORAGE_KEYS, HTTP_STATUS } from './config';

// Services
export { authService } from './authService';
export type {
  PasswordResetRequest,
  PasswordResetConfirm,
  RefreshTokenRequest,
} from './authService';

export { iotService } from './iotService';
export type {
  IngestDataRequest,
  HistoryParams,
  DeviceCommandRequest,
  LatestReadingResponse,
  HistoryResponse,
  DeviceCommandResponse,
} from './iotService';

export { walletService } from './walletService';
export type {
  TransactionFilters,
  WalletBalanceResponse,
  TopupResponse,
  WithdrawResponse,
  PaymentCallbackData,
} from './walletService';

export { default as mlService } from './mlService';
export type {
  SolarForecast,
  ConsumptionForecast,
  PricingRecommendation,
  AnomalyAlert,
} from './mlService';

// Re-export types for convenience
export type {
  User,
  HostProfile,
  BuyerProfile,
  InvestorProfile,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  EnergyReading,
  DailyEnergySummary,
  DeviceInfo,
  Wallet,
  Transaction,
  TopupRequest,
  WithdrawalRequest,
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from '../types';
