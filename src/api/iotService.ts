/**
 * Solar Energy Sharing Platform - IoT Service
 * Handles all IoT/Energy data related API calls
 */

import { api } from './client';
import { ENDPOINTS } from './config';
import {
  EnergyReading,
  DailyEnergySummary,
  DeviceInfo,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export interface IngestDataRequest {
  deviceId: string;
  readings: {
    timestamp?: string;
    powerOutput: number;
    powerConsumed?: number;
    voltage?: number;
    current?: number;
    temperature?: number;
    batteryLevel?: number;
    gridExport?: number;
    gridImport?: number;
    solarIrradiance?: number;
    efficiency?: number;
  }[];
}

export interface HistoryParams {
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  page?: number;
  limit?: number;
}

export interface DeviceCommandRequest {
  deviceId: string;
  command: 'start' | 'stop' | 'restart' | 'update_firmware' | 'calibrate';
  parameters?: Record<string, any>;
}

export interface LatestReadingResponse {
  reading: EnergyReading;
  device: DeviceInfo;
  lastUpdated: string;
}

export interface HistoryResponse {
  readings: EnergyReading[];
  summary: DailyEnergySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeviceCommandResponse {
  commandId: string;
  status: 'queued' | 'sent' | 'acknowledged' | 'completed' | 'failed';
  message: string;
  timestamp: string;
}

class IoTService {
  /**
   * Ingest energy data from devices
   */
  async ingestData(
    data: IngestDataRequest
  ): Promise<ApiResponse<{ processed: number; errors: number }>> {
    return api.post<{ processed: number; errors: number }>(
      ENDPOINTS.iot.ingest,
      data
    );
  }

  /**
   * Get latest reading for a device or user's devices
   */
  async getLatestReading(
    deviceId?: string
  ): Promise<ApiResponse<LatestReadingResponse | LatestReadingResponse[]>> {
    const url = deviceId
      ? `${ENDPOINTS.iot.latest}?deviceId=${deviceId}`
      : ENDPOINTS.iot.latest;

    return api.get<LatestReadingResponse | LatestReadingResponse[]>(url);
  }

  /**
   * Get historical energy data
   */
  async getHistory(params: HistoryParams): Promise<ApiResponse<HistoryResponse>> {
    const queryParams = new URLSearchParams();

    if (params.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.interval) queryParams.append('interval', params.interval);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `${ENDPOINTS.iot.history}?${queryString}`
      : ENDPOINTS.iot.history;

    return api.get<HistoryResponse>(url);
  }

  /**
   * Send command to a device
   */
  async sendDeviceCommand(
    data: DeviceCommandRequest
  ): Promise<ApiResponse<DeviceCommandResponse>> {
    return api.post<DeviceCommandResponse>(ENDPOINTS.iot.deviceCommand, data);
  }

  /**
   * Get today's energy summary
   */
  async getTodaySummary(deviceId?: string): Promise<ApiResponse<DailyEnergySummary>> {
    const today = new Date().toISOString().split('T')[0];
    const params: HistoryParams = {
      deviceId,
      startDate: today,
      endDate: today,
      interval: 'daily',
    };

    const response = await this.getHistory(params);

    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.summary,
      };
    }

    return response as unknown as ApiResponse<DailyEnergySummary>;
  }

  /**
   * Get weekly energy data for charts
   */
  async getWeeklyData(deviceId?: string): Promise<ApiResponse<HistoryResponse>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return this.getHistory({
      deviceId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      interval: 'daily',
    });
  }

  /**
   * Get monthly energy data for charts
   */
  async getMonthlyData(deviceId?: string): Promise<ApiResponse<HistoryResponse>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    return this.getHistory({
      deviceId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      interval: 'daily',
    });
  }

  /**
   * Calculate energy statistics from readings
   */
  calculateStats(readings: EnergyReading[]): {
    totalProduced: number;
    totalConsumed: number;
    netEnergy: number;
    avgEfficiency: number;
    peakOutput: number;
    peakOutputTime: string | null;
  } {
    if (!readings.length) {
      return {
        totalProduced: 0,
        totalConsumed: 0,
        netEnergy: 0,
        avgEfficiency: 0,
        peakOutput: 0,
        peakOutputTime: null,
      };
    }

    const stats = readings.reduce(
      (acc, reading) => {
        const powerOutput = reading.powerOutput ?? reading.power ?? 0;
        acc.totalProduced += powerOutput;
        acc.totalConsumed += reading.powerConsumed || 0;
        acc.totalEfficiency += reading.efficiency || 0;

        if (powerOutput > acc.peakOutput) {
          acc.peakOutput = powerOutput;
          acc.peakOutputTime = reading.timestamp;
        }

        return acc;
      },
      {
        totalProduced: 0,
        totalConsumed: 0,
        totalEfficiency: 0,
        peakOutput: 0,
        peakOutputTime: null as string | null,
      }
    );

    return {
      totalProduced: stats.totalProduced,
      totalConsumed: stats.totalConsumed,
      netEnergy: stats.totalProduced - stats.totalConsumed,
      avgEfficiency: stats.totalEfficiency / readings.length,
      peakOutput: stats.peakOutput,
      peakOutputTime: stats.peakOutputTime,
    };
  }

  /**
   * Get device-specific production data
   */
  async getDeviceProduction(
    deviceId: string,
    startDate?: string,
    endDate?: string,
    interval: 'hourly' | 'daily' | 'weekly' = 'hourly'
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    queryParams.append('interval', interval);

    const queryString = queryParams.toString();
    const url = `/iot/production/device/${deviceId}${queryString ? `?${queryString}` : ''}`;

    return api.get<any>(url);
  }

  /**
   * Get combined production data (all devices)
   */
  async getCombinedProduction(
    startDate?: string,
    endDate?: string,
    interval: 'hourly' | 'daily' | 'weekly' = 'hourly'
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    queryParams.append('interval', interval);

    const queryString = queryParams.toString();
    const url = `/iot/production/combined${queryString ? `?${queryString}` : ''}`;

    return api.get<any>(url);
  }

  /**
   * Format power value for display
   */
  formatPower(watts: number): string {
    if (watts >= 1000000) {
      return `${(watts / 1000000).toFixed(2)} MW`;
    } else if (watts >= 1000) {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${watts.toFixed(2)} W`;
  }

  /**
   * Format energy value for display (kWh)
   */
  formatEnergy(wattHours: number): string {
    if (wattHours >= 1000000) {
      return `${(wattHours / 1000000).toFixed(2)} MWh`;
    } else if (wattHours >= 1000) {
      return `${(wattHours / 1000).toFixed(2)} kWh`;
    }
    return `${wattHours.toFixed(2)} Wh`;
  }
}

export const iotService = new IoTService();
export default iotService;
