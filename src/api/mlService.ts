/**
 * ML Service API Client
 * Interfaces with prediction and forecasting endpoints
 */

import apiClient from './client';

export interface SolarForecast {
  deviceId: string;
  generatedAt: string;
  confidence: number;
  forecasts: Array<{
    date: string;
    predicted: number;
    hourly?: number[];
  }>;
  metadata: {
    capacity: number;
    dataPoints: number;
    source: string;
    model?: string;
  };
}

export interface ConsumptionForecast {
  userId: string;
  generatedAt: string;
  totalPredicted: number;
  forecasts: Array<{
    date: string;
    predicted: number;
    details?: any;
  }>;
  metadata: {
    daysOfHistory: number;
    householdSize?: number;
  };
}

export interface PricingRecommendation {
  recommended_price: number;
  market_avg: number;
  confidence: number;
  factors: {
    supply: number;
    demand: number;
    competition: number;
  };
}

export interface AnomalyAlert {
  id: string;
  device_id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  type: string;
  description: string;
  expected_value?: number;
  actual_value?: number;
  resolved: boolean;
}

const mlService = {
  /**
   * Get solar generation forecast for a device
   */
  getSolarForecast: async (deviceId: string, days: number = 7): Promise<SolarForecast> => {
    const response = await apiClient.get(`/devices/${deviceId}/prediction`, {
      params: { days },
    });
    return response.data.data;
  },

  /**
   * Get prediction accuracy metrics for a device
   */
  getPredictionAccuracy: async (deviceId: string, days: number = 30) => {
    const response = await apiClient.get(`/devices/${deviceId}/prediction/accuracy`, {
      params: { days },
    });
    return response.data;
  },

  /**
   * Get consumption forecast for current user
   */
  getConsumptionForecast: async (days: number = 7): Promise<ConsumptionForecast> => {
    const response = await apiClient.get('/users/consumption-forecast', {
      params: { days },
    });
    return response.data.data;
  },

  /**
   * Get pricing recommendation
   */
  getPricingRecommendation: async (
    energyAmount: number,
    location: { latitude: number; longitude: number }
  ): Promise<PricingRecommendation> => {
    const response = await apiClient.get('/pricing/recommendation', {
      params: {
        energy_amount: energyAmount,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });
    return response.data;
  },

  /**
   * Calculate dynamic price
   */
  calculateDynamicPrice: async (data: {
    energy_amount: number;
    location: { latitude: number; longitude: number };
    time_of_day?: string;
  }) => {
    const response = await apiClient.post('/pricing/calculate', data);
    return response.data;
  },

  /**
   * Get optimal trading times
   */
  getOptimalTradingTimes: async (location: { latitude: number; longitude: number }) => {
    const response = await apiClient.get('/pricing/optimal-times', {
      params: location,
    });
    return response.data;
  },

  /**
   * Get anomaly alerts for user
   */
  getAnomalyAlerts: async (): Promise<AnomalyAlert[]> => {
    const response = await apiClient.get('/anomaly-alerts');
    return response.data.data || [];
  },

  /**
   * Resolve an anomaly alert
   */
  resolveAlert: async (alertId: string) => {
    const response = await apiClient.put(`/anomaly-alerts/${alertId}/resolve`);
    return response.data;
  },

  /**
   * Detect panel degradation
   */
  detectDegradation: async (deviceId: string) => {
    const response = await apiClient.get(`/devices/${deviceId}/health/degradation`);
    return response.data;
  },

  /**
   * Detect equipment failure risk
   */
  detectEquipmentFailure: async (deviceId: string) => {
    const response = await apiClient.get(`/devices/${deviceId}/health/failure`);
    return response.data;
  },
};

export default mlService;
