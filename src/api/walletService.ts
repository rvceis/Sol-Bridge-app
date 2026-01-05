/**
 * Solar Energy Sharing Platform - Wallet Service
 * Handles all wallet and transaction related API calls
 */

import { api } from './client';
import { ENDPOINTS } from './config';
import {
  Wallet,
  Transaction,
  TopupRequest,
  WithdrawalRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export interface TransactionFilters {
  type?: 'credit' | 'debit' | 'transfer' | 'topup' | 'withdrawal' | 'energy_purchase' | 'energy_sale';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface WalletBalanceResponse {
  wallet: Wallet;
  pendingTransactions: number;
  recentActivity: Transaction[];
}

export interface TopupResponse {
  transaction: Transaction;
  paymentUrl?: string;
  paymentReference?: string;
}

export interface WithdrawResponse {
  transaction: Transaction;
  estimatedArrival?: string;
}

export interface PaymentCallbackData {
  reference: string;
  status: 'success' | 'failed';
  transactionId?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

class WalletService {
  /**
   * Get wallet balance and summary
   */
  async getBalance(): Promise<ApiResponse<WalletBalanceResponse>> {
    return api.get<WalletBalanceResponse>(ENDPOINTS.wallet.balance);
  }

  /**
   * Get transaction history with filters
   */
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${ENDPOINTS.wallet.transactions}?${queryString}`
      : ENDPOINTS.wallet.transactions;

    return api.get<PaginatedResponse<Transaction>>(url);
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return api.get<Transaction>(`${ENDPOINTS.wallet.transactions}/${transactionId}`);
  }

  /**
   * Top up wallet
   */
  async topup(data: TopupRequest): Promise<ApiResponse<TopupResponse>> {
    return api.post<TopupResponse>(ENDPOINTS.wallet.topup, data);
  }

  /**
   * Withdraw from wallet
   */
  async withdraw(data: WithdrawalRequest): Promise<ApiResponse<WithdrawResponse>> {
    return api.post<WithdrawResponse>(ENDPOINTS.wallet.withdraw, data);
  }

  /**
   * Handle payment callback (used for payment verification)
   */
  async handlePaymentCallback(
    data: PaymentCallbackData
  ): Promise<ApiResponse<{ verified: boolean; transaction?: Transaction }>> {
    return api.post<{ verified: boolean; transaction?: Transaction }>(
      ENDPOINTS.wallet.paymentCallback,
      data
    );
  }

  /**
   * Get transaction summary for a period
   */
  async getTransactionSummary(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalCredits: number;
    totalDebits: number;
    netChange: number;
    transactionCount: number;
    energyPurchases: number;
    energySales: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const response = await this.getTransactions({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 1000, // Get all transactions for the period
    });

    if (!response.success || !response.data) {
      return {
        totalCredits: 0,
        totalDebits: 0,
        netChange: 0,
        transactionCount: 0,
        energyPurchases: 0,
        energySales: 0,
      };
    }

    const transactions = response.data.data;

    return transactions.reduce(
      (acc: { totalCredits: number; totalDebits: number; netChange: number; transactionCount: number; energyPurchases: number; energySales: number }, tx: Transaction) => {
        if (tx.type === 'energy_sale' || tx.type === 'wallet_topup' || tx.type === 'refund' || tx.type === 'investment_return') {
          acc.totalCredits += tx.amount;
        } else {
          acc.totalDebits += tx.amount;
        }

        if (tx.type === 'energy_purchase') {
          acc.energyPurchases += tx.amount;
        } else if (tx.type === 'energy_sale') {
          acc.energySales += tx.amount;
        }

        acc.transactionCount++;
        acc.netChange = acc.totalCredits - acc.totalDebits;

        return acc;
      },
      {
        totalCredits: 0,
        totalDebits: 0,
        netChange: 0,
        transactionCount: 0,
        energyPurchases: 0,
        energySales: 0,
      }
    );
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get transaction type display name
   */
  getTransactionTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      credit: 'Credit',
      debit: 'Debit',
      transfer: 'Transfer',
      topup: 'Top Up',
      withdrawal: 'Withdrawal',
      energy_purchase: 'Energy Purchase',
      energy_sale: 'Energy Sale',
    };

    return typeNames[type] || type;
  }

  /**
   * Get transaction status color
   */
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      pending: '#FFA500',
      completed: '#4CAF50',
      failed: '#F44336',
      cancelled: '#9E9E9E',
    };

    return statusColors[status] || '#757575';
  }

  /**
   * Check if amount is positive (credit)
   */
  isCredit(type: string): boolean {
    return ['credit', 'topup', 'energy_sale'].includes(type);
  }
}

export const walletService = new WalletService();
export default walletService;
