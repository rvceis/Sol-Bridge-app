/**
 * Payment Service - Razorpay Integration
 */

import { api } from '../api/client';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key_id: string;
  testMode?: boolean;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  /**
   * Get Razorpay public key
   */
  async getRazorpayKey(): Promise<string> {
    const response = await api.get<{ key_id: string }>('/payment/config/razorpay-key');
    return response.data.key_id;
  },

  /**
   * Create wallet top-up order
   */
  async createTopupOrder(amount: number): Promise<RazorpayOrderResponse> {
    const response = await api.post<RazorpayOrderResponse>('/payment/topup/create-order', {
      amount,
    });
    return response.data;
  },

  /**
   * Create energy payment order
   */
  async createEnergyPaymentOrder(
    transactionId: string,
    amount: number
  ): Promise<RazorpayOrderResponse> {
    const response = await api.post<RazorpayOrderResponse>('/payment/energy/create-order', {
      transactionId,
      amount,
    });
    return response.data;
  },

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData: PaymentVerification): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/payment/verify', paymentData);
    return response.data;
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(limit = 20, offset = 0) {
    const response = await api.get(`/payment/history?limit=${limit}&offset=${offset}`);
    return response;
  },

  /**
   * Request refund
   */
  async requestRefund(paymentId: string, amount: number, reason: string) {
    const response = await api.post('/payment/refund', {
      paymentId,
      amount,
      reason,
    });
    return response;
  },
};
