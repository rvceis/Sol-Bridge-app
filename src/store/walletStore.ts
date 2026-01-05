/**
 * Solar Energy Sharing Platform - Wallet Store
 * Manages wallet and transaction state with Zustand
 */

import { create } from 'zustand';
import { Wallet, Transaction, TopupRequest, WithdrawalRequest } from '../types';
import { walletService, WalletBalanceResponse, TransactionFilters } from '../api';

interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netChange: number;
  transactionCount: number;
  energyPurchases: number;
  energySales: number;
}

interface WalletState {
  // State
  wallet: Wallet | null;
  transactions: Transaction[];
  recentActivity: Transaction[];
  pendingTransactions: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  hasMore: boolean;

  // Summary
  monthlySummary: TransactionSummary | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  topup: (data: TopupRequest) => Promise<{ success: boolean; paymentUrl?: string }>;
  withdraw: (data: WithdrawalRequest) => Promise<boolean>;
  fetchMonthlySummary: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  // Initial State
  wallet: null,
  transactions: [],
  recentActivity: [],
  pendingTransactions: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,

  // Pagination
  currentPage: 1,
  totalPages: 1,
  hasMore: false,

  // Summary
  monthlySummary: null,

  // Fetch wallet balance
  fetchBalance: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await walletService.getBalance();

      if (response.success && response.data) {
        const data = response.data as WalletBalanceResponse;
        set({
          wallet: data.wallet,
          pendingTransactions: data.pendingTransactions,
          recentActivity: data.recentActivity,
          isLoading: false,
          lastUpdated: new Date(),
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to fetch balance',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Fetch transactions
  fetchTransactions: async (filters?: TransactionFilters): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await walletService.getTransactions({
        ...filters,
        page: 1,
        limit: 20,
      });

      if (response.success && response.data) {
        const { data: items, pagination } = response.data;
        set({
          transactions: items,
          currentPage: pagination.page,
          totalPages: pagination.pages,
          hasMore: pagination.page < pagination.pages,
          isLoading: false,
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to fetch transactions',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Load more transactions (pagination)
  loadMoreTransactions: async (): Promise<void> => {
    const { currentPage, hasMore, transactions } = get();

    if (!hasMore) return;

    set({ isLoading: true });

    try {
      const response = await walletService.getTransactions({
        page: currentPage + 1,
        limit: 20,
      });

      if (response.success && response.data) {
        const { data: items, pagination } = response.data;
        set({
          transactions: [...transactions, ...items],
          currentPage: pagination.page,
          totalPages: pagination.pages,
          hasMore: pagination.page < pagination.pages,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Top up wallet
  topup: async (
    data: TopupRequest
  ): Promise<{ success: boolean; paymentUrl?: string }> => {
    set({ isLoading: true, error: null });

    try {
      const response = await walletService.topup(data);

      if (response.success && response.data) {
        // Refresh balance after topup
        get().fetchBalance();

        set({ isLoading: false });

        return {
          success: true,
          paymentUrl: response.data.paymentUrl,
        };
      } else {
        set({
          isLoading: false,
          error: response.message || 'Topup failed',
        });
        return { success: false };
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
      return { success: false };
    }
  },

  // Withdraw from wallet
  withdraw: async (data: WithdrawalRequest): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await walletService.withdraw(data);

      if (response.success) {
        // Refresh balance after withdrawal
        get().fetchBalance();

        set({ isLoading: false });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.message || 'Withdrawal failed',
        });
        return false;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
      return false;
    }
  },

  // Fetch monthly summary
  fetchMonthlySummary: async (): Promise<void> => {
    try {
      const summary = await walletService.getTransactionSummary('month');
      set({ monthlySummary: summary });
    } catch (error: any) {
      // Silent fail - not critical
      console.warn('Failed to fetch monthly summary:', error.message);
    }
  },

  // Refresh all data
  refresh: async (): Promise<void> => {
    set({ isRefreshing: true });

    try {
      await Promise.all([
        get().fetchBalance(),
        get().fetchTransactions(),
        get().fetchMonthlySummary(),
      ]);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Clear error
  clearError: (): void => {
    set({ error: null });
  },
}));

// Selectors
export const selectWallet = (state: WalletState) => state.wallet;
export const selectBalance = (state: WalletState) => state.wallet?.balance || 0;
export const selectTransactions = (state: WalletState) => state.transactions;
export const selectRecentActivity = (state: WalletState) => state.recentActivity;
export const selectIsLoading = (state: WalletState) => state.isLoading;
export const selectHasMore = (state: WalletState) => state.hasMore;
export const selectMonthlySummary = (state: WalletState) => state.monthlySummary;

// Formatting helpers (re-exported from service for convenience)
export const formatCurrency = walletService.formatCurrency.bind(walletService);
export const getTransactionTypeName =
  walletService.getTransactionTypeName.bind(walletService);
export const getStatusColor = walletService.getStatusColor.bind(walletService);
export const isCredit = walletService.isCredit.bind(walletService);
