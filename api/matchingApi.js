import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Simple in-memory cache for matches
const matchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Timeout configuration for better performance
const API_TIMEOUT = 10000; // 10 seconds max

const getCacheKey = (requirement) => {
  return `sellers_${requirement.requiredKwh}_${requirement.maxPrice}_${requirement.renewable}`;
};

const matchingApi = {
  /**
   * Find best sellers for buyer's energy requirement with caching
   * Returns ranked list of sellers with detailed match scores
   */
  findSellers: async (buyerRequirement) => {
    try {
      // Check cache first
      const cacheKey = getCacheKey(buyerRequirement);
      const cachedData = matchCache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log('[CACHE HIT] Returning cached matches');
        return cachedData.data;
      }

      // Create axios instance with timeout
      const instance = axios.create({
        timeout: API_TIMEOUT,
      });

      const response = await instance.post(
        `${API_BASE_URL}/api/v1/matching/find-sellers`,
        {
          requiredKwh: buyerRequirement.requiredKwh,
          maxPrice: buyerRequirement.maxPrice,
          preferences: {
            renewable: buyerRequirement.renewable || false,
            minRating: buyerRequirement.minRating || 3.0,
          },
        }
      );
      
      // Cache the response
      const data = response.data.data;
      matchCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - backend is taking too long to respond');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  },

  /**
   * Get detailed match information including all scoring factors
   */
  getMatchDetails: async (matchId) => {
    try {
      const instance = axios.create({ timeout: API_TIMEOUT });
      const response = await instance.get(
        `${API_BASE_URL}/api/v1/matching/matches/${matchId}`
      );
      
      return response.data.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch match details');
    }
  },

  /**
   * Create smart allocation based on selected matches
   */
  createAllocation: async (selectedMatches) => {
    try {
      const instance = axios.create({ timeout: API_TIMEOUT });
      const response = await instance.post(
        `${API_BASE_URL}/api/v1/matching/allocate`,
        {
          matches: selectedMatches.map(match => ({
            match_id: match.id,
            seller_id: match.seller_id,
            allocated_kwh: match.available_kwh,
          })),
        }
      );
      
      return response.data.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      }
      throw new Error(error.response?.data?.message || 'Failed to create allocation');
    }
  },

  /**
   * Get user's active allocations with caching
   */
  getActiveAllocations: async (forceRefresh = false) => {
    try {
      // Simple cache for allocations (1 minute)
      const allocationsCacheKey = 'allocations_active';
      if (!forceRefresh) {
        const cachedAlloc = matchCache.get(allocationsCacheKey);
        if (cachedAlloc && Date.now() - cachedAlloc.timestamp < 60000) {
          return cachedAlloc.data;
        }
      }

      const instance = axios.create({ timeout: API_TIMEOUT });
      const response = await instance.get(
        `${API_BASE_URL}/api/v1/matching/allocations/active`
      );
      
      const data = response.data.data;
      matchCache.set(allocationsCacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch allocations');
    }
  },

  /**
   * Cancel an active allocation
   */
  cancelAllocation: async (allocationId) => {
    try {
      const instance = axios.create({ timeout: API_TIMEOUT });
      const response = await instance.delete(
        `${API_BASE_URL}/api/v1/matching/allocations/${allocationId}`
      );
      
      // Clear allocation cache on cancel
      matchCache.delete('allocations_active');
      
      return response.data.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      }
      throw new Error(error.response?.data?.message || 'Failed to cancel allocation');
    }
  },

  /**
   * Clear all caches (useful for forced refresh)
   */
  clearCache: () => {
    matchCache.clear();
  },

  /**
   * Get matching statistics for dashboard
   */
  getMatchingStats: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/matching/statistics`
      );
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },

  /**
   * Calculate estimated cost for given requirements
   */
  calculateEstimate: async (requiredKwh, maxPrice) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/matching/estimate`,
        {
          requiredKwh,
          maxPrice,
        }
      );
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to calculate estimate');
    }
  },
};

export default matchingApi;
