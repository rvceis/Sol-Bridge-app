/**
 * Solar Energy Sharing Platform - Store Index
 * Central export for all Zustand stores
 */

// Auth Store
export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading as selectAuthLoading,
  selectAuthError,
  selectIsOnboarded,
  selectUserRole,
} from './authStore';
export type { AuthStatus } from './authStore';

// Energy Store
export {
  useEnergyStore,
  selectLatestReading,
  selectReadings,
  selectDailySummary,
  selectStats,
  selectIsLoading as selectEnergyLoading,
  selectTimeRange,
  selectLastUpdated,
  formatPower,
  formatEnergy,
} from './energyStore';
export type { TimeRange } from './energyStore';

// Wallet Store
export {
  useWalletStore,
  selectWallet,
  selectBalance,
  selectTransactions,
  selectRecentActivity,
  selectIsLoading as selectWalletLoading,
  selectHasMore,
  selectMonthlySummary,
  formatCurrency,
  getTransactionTypeName,
  getStatusColor,
  isCredit,
} from './walletStore';

// Device Store
export { useDeviceStore } from './deviceStore';
