import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const matchingApi = {
  /**
   * Find best sellers for buyer's energy requirement
   * Returns ranked list of sellers with detailed match scores
   */
  findSellers: async (buyerRequirement) => {
    try {
      const response = await axios.post(
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
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  },

  /**
   * Get detailed match information including all scoring factors
   */
  getMatchDetails: async (matchId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/matching/matches/${matchId}`
      );
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch match details');
    }
  },

  /**
   * Create smart allocation based on selected matches
   */
  createAllocation: async (selectedMatches) => {
    try {
      const response = await axios.post(
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
      throw new Error(error.response?.data?.message || 'Failed to create allocation');
    }
  },

  /**
   * Get user's active allocations
   */
  getActiveAllocations: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/matching/allocations/active`
      );
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch allocations');
    }
  },

  /**
   * Cancel an active allocation
   */
  cancelAllocation: async (allocationId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/matching/allocations/${allocationId}`
      );
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel allocation');
    }
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
