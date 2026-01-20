import apiClient from './client';

// Profile API
export const profileApi = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (updates: {
    full_name?: string;
    phone?: string;
  }) => {
    const response = await apiClient.put('/users/profile', updates);
    return response.data;
  },

  // Get addresses
  getAddresses: async () => {
    const response = await apiClient.get('/users/addresses');
    return response.data;
  },

  // Add address
  addAddress: async (addressData: {
    address_type?: 'home' | 'work' | 'billing' | 'other';
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
  }) => {
    const response = await apiClient.post('/users/addresses', addressData);
    return response.data;
  },

  // Update address
  updateAddress: async (id: string, updates: any) => {
    const response = await apiClient.put(`/users/addresses/${id}`, updates);
    return response.data;
  },

  // Delete address
  deleteAddress: async (id: string) => {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await apiClient.get('/users/payment-methods');
    return response.data;
  },

  // Add payment method
  addPaymentMethod: async (paymentData: {
    method_type: 'card' | 'upi' | 'bank_transfer' | 'wallet';
    card_last4?: string;
    card_brand?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    upi_id?: string;
    bank_name?: string;
    account_number_last4?: string;
    ifsc_code?: string;
    wallet_provider?: string;
    is_default?: boolean;
  }) => {
    const response = await apiClient.post('/users/payment-methods', paymentData);
    return response.data;
  },

  // Delete payment method
  deletePaymentMethod: async (id: string) => {
    const response = await apiClient.delete(`/users/payment-methods/${id}`);
    return response.data;
  },

  // Get documents
  getDocuments: async () => {
    const response = await apiClient.get('/users/documents');
    return response.data;
  },

  // Upload document
  uploadDocument: async (documentData: {
    document_type: 'identity' | 'address_proof' | 'bank_statement' | 'pan_card' | 'aadhaar' | 'other';
    document_name: string;
  }) => {
    const response = await apiClient.post('/users/documents', documentData);
    return response.data;
  },

  // Get documents
  getDocuments: async () => {
    const response = await apiClient.get('/profile/documents');
    return response.data;
  },

  // Upload document
  uploadDocument: async (file: any, documentType: string, documentName: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);
    formData.append('document_name', documentName);

    const response = await apiClient.post('/profile/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string) => {
    const response = await apiClient.delete(`/profile/documents/${id}`);
    return response.data;
  },

  // Get preferences
  getPreferences: async () => {
    const response = await apiClient.get('/users/preferences');
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: {
    notifications_push?: boolean;
    notifications_email?: boolean;
    notifications_sms?: boolean;
    notifications_marketing?: boolean;
    security_two_factor?: boolean;
    security_biometric?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    currency?: string;
    timezone?: string;
    auto_update?: boolean;
    analytics_enabled?: boolean;
  }) => {
    const response = await apiClient.put('/users/preferences', preferences);
    return response.data;
  },
};

export default profileApi;
