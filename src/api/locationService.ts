import apiClient from './client';

// Location & AI Optimization API
export const locationApi = {
  // Get nearby users (sellers, investors, hosters)
  getNearbyUsers: async (
    latitude: number,
    longitude: number,
    radius: number = 50,
    types: string[] = ['seller', 'investor', 'hoster']
  ) => {
    // Map frontend roles to backend expectations
    const mappedTypes = types.map((t) => (t === 'hoster' ? 'host' : t));
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
      types: mappedTypes.join(','),
      roles: mappedTypes.join(','), // backend compatibility
      type: mappedTypes[0] || 'seller', // fallback param name some APIs use
    });
    const response = await apiClient.get(`/location/nearby-users?${params.toString()}`);
    return response.data;
  },

  // Get nearby listings
  getNearbyListings: async (latitude: number, longitude: number, radius: number = 50, filters?: {
    min_price?: number;
    max_price?: number;
    min_energy?: number;
    max_energy?: number;
    renewable_only?: boolean;
    listing_type?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/location/nearby-listings?${params.toString()}`);
    return response.data;
  },

  // Get energy heatmap
  getEnergyHeatmap: async (latitude: number, longitude: number, radius: number = 100) => {
    const response = await apiClient.get(`/location/heatmap?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    return response.data;
  },

  // Update user location
  updateLocation: async (latitude: number, longitude: number) => {
    const response = await apiClient.put('/location/update', { latitude, longitude });
    return response.data;
  },

  // Get optimal energy allocation (AI-powered)
  getOptimalAllocation: async (energyNeeded: number, latitude: number, longitude: number, preferences?: {
    max_distance?: number;
    max_price?: number;
    prefer_renewable?: boolean;
    min_rating?: number;
  }) => {
    const response = await apiClient.post('/location/optimal-allocation', {
      energy_needed: energyNeeded,
      latitude,
      longitude,
      ...preferences,
    });
    return response.data;
  },

  // Get pricing recommendation (AI-powered)
  getPricingRecommendation: async (energyAmount: number, latitude: number, longitude: number) => {
    const response = await apiClient.get(`/location/pricing-recommendation?energy_amount=${energyAmount}&latitude=${latitude}&longitude=${longitude}`);
    return response.data;
  },

  // Get investment opportunities (AI-scored)
  getInvestmentOpportunities: async (latitude: number, longitude: number, budget: number) => {
    const response = await apiClient.get(`/location/investment-opportunities?latitude=${latitude}&longitude=${longitude}&budget=${budget}`);
    return response.data;
  },

  // Get demand prediction (ML-based)
  getDemandPrediction: async (latitude: number, longitude: number, days: number = 7) => {
    const response = await apiClient.get(`/location/demand-prediction?latitude=${latitude}&longitude=${longitude}&days=${days}`);
    return response.data;
  },
};

export default locationApi;
