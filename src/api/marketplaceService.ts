import apiClient from './client';

// Marketplace API
export const marketplaceApi = {
  // Get all listings
  getListings: async (filters?: {
    min_price?: number;
    max_price?: number;
    min_energy?: number;
    max_energy?: number;
    listing_type?: 'spot' | 'forward' | 'subscription';
    renewable_only?: boolean;
    seller_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/marketplace/listings?${params.toString()}`);
    return response.data;
  },

  // Get nearby listings
  getNearbyListings: async (
    latitude: number,
    longitude: number,
    filters?: {
      min_price?: number;
      max_price?: number;
      min_energy?: number;
      max_energy?: number;
      listing_type?: 'spot' | 'forward' | 'subscription';
      renewable_only?: boolean;
      radius?: number; // in kilometers
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams();
    params.append('latitude', String(latitude));
    params.append('longitude', String(longitude));
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/marketplace/nearby-listings?${params.toString()}`);
    return response.data;
  },

  // Get listing by ID
  getListingById: async (id: string) => {
    const response = await apiClient.get(`/marketplace/listings/${id}`);
    return response.data;
  },

  // Create listing
  createListing: async (listingData: {
    device_id?: string;
    energy_amount_kwh: number;
    price_per_kwh: number;
    available_from: string;
    available_to: string;
    listing_type?: 'spot' | 'forward' | 'subscription';
    min_purchase_kwh?: number;
    location_latitude?: number;
    location_longitude?: number;
    renewable_cert?: boolean;
    description?: string;
  }) => {
    const response = await apiClient.post('/marketplace/listings', listingData);
    return response.data;
  },

  // Update listing
  updateListing: async (id: string, updates: any) => {
    const response = await apiClient.put(`/marketplace/listings/${id}`, updates);
    return response.data;
  },

  // Delete listing
  deleteListing: async (id: string) => {
    const response = await apiClient.delete(`/marketplace/listings/${id}`);
    return response.data;
  },

  // Get my listings
  getMyListings: async () => {
    const response = await apiClient.get('/marketplace/my-listings');
    return response.data;
  },

  // Get my devices
  getMyDevices: async () => {
    const response = await apiClient.get('/devices/my-devices');
    return response.data;
  },

  // Create device
  createDevice: async (deviceData: {
    device_name: string;
    device_type: string;
    capacity_kwh?: number | null;
    efficiency_rating?: number | null;
  }) => {
    const response = await apiClient.post('/devices', deviceData);
    return response.data;
  },

  // Update device
  updateDevice: async (deviceId: string, updates: any) => {
    const response = await apiClient.put(`/devices/${deviceId}`, updates);
    return response.data;
  },

  // Delete device
  deleteDevice: async (deviceId: string) => {
    const response = await apiClient.delete(`/devices/${deviceId}`);
    return response.data;
  },

  // Get my payment methods
  getMyPaymentMethods: async () => {
    const response = await apiClient.get('/users/payment-methods');
    return response.data;
  },

  // Buy energy
  buyEnergy: async (transactionData: {
    listing_id: string;
    energy_amount_kwh: number;
    payment_method_id: string;
  }) => {
    const response = await apiClient.post('/marketplace/transactions', transactionData);
    return response.data;
  },

  // Get my transactions
  getMyTransactions: async (role: 'buyer' | 'seller' = 'buyer') => {
    const response = await apiClient.get(`/marketplace/transactions?role=${role}`);
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (id: string) => {
    const response = await apiClient.get(`/marketplace/transactions/${id}`);
    return response.data;
  },

  // Update transaction
  updateTransaction: async (id: string, updates: {
    status?: string;
    payment_status?: string;
    delivery_status?: string;
    rating?: number;
    review?: string;
  }) => {
    const response = await apiClient.put(`/marketplace/transactions/${id}`, updates);
    return response.data;
  },

  // Get market statistics
  getMarketStatistics: async (days: number = 30) => {
    const response = await apiClient.get(`/marketplace/statistics?days=${days}`);
    return response.data;
  },

  // ===== AI MATCHING API =====

  // Find best seller matches for buyer's energy requirement
  findSellerMatches: async (payload: {
    requiredKwh: number;
    maxPrice?: number;
    preferences?: {
      renewable?: boolean;
      minRating?: number;
      maxDistance?: number;
    };
  }) => {
    const response = await apiClient.post('/matching/find-sellers', payload);
    return response.data;
  },

  // Find best buyer matches for seller's energy production
  findBuyerMatches: async (payload: {
    availableKwh: number;
    pricePerKwh?: number;
  }) => {
    const response = await apiClient.post('/matching/find-buyers', payload);
    return response.data;
  },

  // Get detailed match breakdown with all scoring factors
  getMatchDetails: async (matchId: string) => {
    const response = await apiClient.get(`/matching/matches/${matchId}`);
    return response.data;
  },

  // Create smart energy allocation based on matches
  createSmartAllocation: async (payload: {
    requiredKwh: number;
    maxPrice?: number;
    preferences?: {
      renewable?: boolean;
      minRating?: number;
    };
  }) => {
    const response = await apiClient.post('/matching/allocate', payload);
    return response.data;
  },

  // Get active allocations for user
  getActiveAllocations: async () => {
    const response = await apiClient.get('/matching/allocations/active');
    return response.data;
  },

  // ===== Energy Sources API (For Buyers) =====
  
  // Find matching energy sources (hosts) based on preferences
  findEnergySources: async (preferences?: {
    maxPrice?: number;
    maxDistance?: number;
    renewableOnly?: boolean;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (preferences) {
      if (preferences.maxPrice) params.append('maxPrice', String(preferences.maxPrice));
      if (preferences.maxDistance) params.append('maxDistance', String(preferences.maxDistance));
      if (preferences.renewableOnly) params.append('renewableOnly', 'true');
      if (preferences.limit) params.append('limit', String(preferences.limit));
    }
    const response = await apiClient.get(`/energy-sources/find?${params.toString()}`);
    return response.data;
  },

  // Save a host as buyer's energy source
  saveEnergySource: async (sourceData: {
    hostId: string;
    sourceName?: string;
    matchScore?: number;
    pricePerKwh?: number;
    distanceKm?: number;
    renewableCertified?: boolean;
    subscriptionType?: 'on-demand' | 'monthly' | 'yearly';
    notes?: string;
  }) => {
    const response = await apiClient.post('/energy-sources/save', sourceData);
    return response.data;
  },

  // Get buyer's saved energy sources
  getMyEnergySources: async (activeOnly: boolean = true) => {
    const response = await apiClient.get(`/energy-sources/my-sources?activeOnly=${activeOnly}`);
    return response.data;
  },

  // Remove an energy source
  removeEnergySource: async (sourceId: string) => {
    const response = await apiClient.delete(`/energy-sources/${sourceId}`);
    return response.data;
  },
};

export default marketplaceApi;
