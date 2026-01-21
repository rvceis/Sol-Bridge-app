/**
 * ML Service API Client
 * Interfaces with prediction and forecasting endpoints
 */

import apiClient from './client';

// ML endpoints live on solbridge-ai service; base URL is configured via API_CONFIG.mlServiceUrl
// All endpoints are POST per docs unless noted.

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
  getSolarForecast: async (payload: { device_id?: string; hours?: number }) => {
    const response = await apiClient.post('/forecast/solar', payload);
    return response.data;
  },

  /**
   * Get prediction accuracy metrics for a device
   */
  getPredictionAccuracy: async (deviceId: string, days: number = 30) => {
    const response = await apiClient.post('/forecast/solar', {
      device_id: deviceId,
      hours: days * 24,
    });
    return response.data;
  },

  /**
   * Get consumption forecast for current user
   */
  getConsumptionForecast: async (hours: number = 24) => {
    const response = await apiClient.post('/forecast/demand', { hours });
    return response.data;
  },

  /**
   * Get pricing recommendation
   */
  getPricingRecommendation: async (
    energyAmount: number,
    location: { latitude: number; longitude: number }
  ): Promise<PricingRecommendation> => {
    const response = await apiClient.post('/pricing/calculate', {
      energy_amount: energyAmount,
      latitude: location.latitude,
      longitude: location.longitude,
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
    const response = await apiClient.post('/pricing/optimal-times', location);
    return response.data;
  },

  /**
   * Get anomaly alerts for user
   */
  getAnomalyAlerts: async (): Promise<AnomalyAlert[]> => {
    const response = await apiClient.post('/anomaly/detect', {});
    return response.data?.data || response.data || [];
  },

  /**
   * Resolve an anomaly alert
   */
  resolveAlert: async (alertId: string) => {
    const response = await apiClient.post('/anomaly/detect', { resolve_id: alertId });
    return response.data;
  },

  /**
   * Detect panel degradation
   */
  detectDegradation: async (deviceId: string) => {
    const response = await apiClient.post('/models/status', { device_id: deviceId });
    return response.data;
  },

  /**
   * Detect equipment failure risk
   */
  detectEquipmentFailure: async (deviceId: string) => {
    const response = await apiClient.post('/anomaly/detect', { device_id: deviceId });
    return response.data;
  },
};

export default mlService;
