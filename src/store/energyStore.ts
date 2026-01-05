/**
 * Solar Energy Sharing Platform - Energy Store
 * Manages energy/IoT state with Zustand
 */

import { create } from 'zustand';
import { EnergyReading, DailyEnergySummary, DeviceInfo } from '../types';
import { iotService, LatestReadingResponse, HistoryResponse } from '../api';

export type TimeRange = 'today' | 'week' | 'month' | 'year';

interface EnergyState {
  // State
  latestReading: EnergyReading | null;
  readings: EnergyReading[];
  dailySummary: DailyEnergySummary | null;
  devices: DeviceInfo[];
  selectedDeviceId: string | null;
  selectedTimeRange: TimeRange;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Computed stats
  stats: {
    totalProduced: number;
    totalConsumed: number;
    netEnergy: number;
    avgEfficiency: number;
    peakOutput: number;
    peakOutputTime: string | null;
  };

  // Actions
  fetchLatestReading: (deviceId?: string) => Promise<void>;
  fetchHistory: (timeRange?: TimeRange) => Promise<void>;
  fetchTodaySummary: () => Promise<void>;
  setSelectedDevice: (deviceId: string | null) => void;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const initialStats = {
  totalProduced: 0,
  totalConsumed: 0,
  netEnergy: 0,
  avgEfficiency: 0,
  peakOutput: 0,
  peakOutputTime: null,
};

export const useEnergyStore = create<EnergyState>()((set, get) => ({
  // Initial State
  latestReading: null,
  readings: [],
  dailySummary: null,
  devices: [],
  selectedDeviceId: null,
  selectedTimeRange: 'today',
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  stats: initialStats,

  // Fetch latest reading
  fetchLatestReading: async (deviceId?: string): Promise<void> => {
    const targetDeviceId = deviceId || get().selectedDeviceId;

    set({ isLoading: true, error: null });

    try {
      const response = await iotService.getLatestReading(targetDeviceId || undefined);

      if (response.success && response.data) {
        const data = response.data as LatestReadingResponse;
        set({
          latestReading: data.reading,
          devices: data.device ? [data.device] : get().devices,
          isLoading: false,
          lastUpdated: new Date(),
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to fetch latest reading',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Fetch history
  fetchHistory: async (timeRange?: TimeRange): Promise<void> => {
    const range = timeRange || get().selectedTimeRange;
    const deviceId = get().selectedDeviceId;

    set({ isLoading: true, error: null });

    try {
      let response;

      switch (range) {
        case 'week':
          response = await iotService.getWeeklyData(deviceId || undefined);
          break;
        case 'month':
          response = await iotService.getMonthlyData(deviceId || undefined);
          break;
        default:
          // Today or custom
          const today = new Date().toISOString().split('T')[0];
          response = await iotService.getHistory({
            deviceId: deviceId || undefined,
            startDate: today,
            endDate: today,
            interval: 'hourly',
          });
      }

      if (response.success && response.data) {
        const historyData = response.data as HistoryResponse;
        const calculatedStats = iotService.calculateStats(historyData.readings);

        set({
          readings: historyData.readings,
          dailySummary: historyData.summary,
          stats: calculatedStats,
          isLoading: false,
          lastUpdated: new Date(),
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to fetch history',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Fetch today's summary
  fetchTodaySummary: async (): Promise<void> => {
    const deviceId = get().selectedDeviceId;

    try {
      const response = await iotService.getTodaySummary(deviceId || undefined);

      if (response.success && response.data) {
        set({ dailySummary: response.data });
      }
    } catch (error: any) {
      // Silent fail for summary - not critical
      console.warn('Failed to fetch today summary:', error.message);
    }
  },

  // Set selected device
  setSelectedDevice: (deviceId: string | null): void => {
    set({ selectedDeviceId: deviceId });

    // Refresh data for the new device
    const { fetchLatestReading, fetchHistory } = get();
    fetchLatestReading(deviceId || undefined);
    fetchHistory();
  },

  // Set time range
  setTimeRange: (range: TimeRange): void => {
    set({ selectedTimeRange: range });

    // Refresh history for the new range
    get().fetchHistory(range);
  },

  // Refresh all data
  refresh: async (): Promise<void> => {
    set({ isRefreshing: true });

    try {
      await Promise.all([
        get().fetchLatestReading(),
        get().fetchHistory(),
        get().fetchTodaySummary(),
      ]);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Clear error
  clearError: (): void => {
    set({ error: null });
  },
}));

// Selectors
export const selectLatestReading = (state: EnergyState) => state.latestReading;
export const selectReadings = (state: EnergyState) => state.readings;
export const selectDailySummary = (state: EnergyState) => state.dailySummary;
export const selectStats = (state: EnergyState) => state.stats;
export const selectIsLoading = (state: EnergyState) => state.isLoading;
export const selectTimeRange = (state: EnergyState) => state.selectedTimeRange;
export const selectLastUpdated = (state: EnergyState) => state.lastUpdated;

// Formatting helpers (re-exported from service for convenience)
export const formatPower = iotService.formatPower.bind(iotService);
export const formatEnergy = iotService.formatEnergy.bind(iotService);
