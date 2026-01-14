/**
 * Solar Energy Sharing Platform - Device Store
 * Manages device management state with Zustand
 */

import { create } from 'zustand';
import { ApiResponse } from '../types';

// Device interface matching backend structure
interface Device {
  device_id: string;
  device_type: 'solar_meter' | 'consumption_meter' | 'battery_bms' | 'weather_station';
  device_model?: string;
  firmware_version?: string;
  status: 'pending' | 'active' | 'inactive' | 'faulty' | 'decommissioned';
  last_seen_at?: string;
  installation_date?: string;
  configuration?: Record<string, any>;
  user_id?: string;
  last_reading?: Record<string, any>;
}

interface DeviceState {
  // State
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  fetchDevices: () => Promise<void>;
  createDevice: (deviceType: string, deviceModel?: string, firmwareVersion?: string) => Promise<Device | null>;
  selectDevice: (device: Device | null) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<Device | null>;
  deleteDevice: (deviceId: string) => Promise<boolean>;
  refreshDevices: () => Promise<void>;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceState>()((set, get) => ({
  // Initial State
  devices: [],
  selectedDevice: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,

  // Fetch all devices
  fetchDevices: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/v1/iot/devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data?.devices) {
        set({
          devices: data.data.devices,
          isLoading: false,
          lastUpdated: new Date(),
        });
      } else {
        set({
          isLoading: false,
          error: data.message || 'Failed to fetch devices',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
    }
  },

  // Create new device
  createDevice: async (deviceType, deviceModel, firmwareVersion): Promise<Device | null> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/v1/iot/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          deviceType,
          deviceModel,
          firmwareVersion,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.device) {
        const newDevice = data.data.device;
        set((state) => ({
          devices: [newDevice, ...state.devices],
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        }));
        return newDevice;
      } else {
        set({
          isLoading: false,
          error: data.message || 'Failed to create device',
        });
        return null;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
      return null;
    }
  },

  // Select device
  selectDevice: (device: Device | null): void => {
    set({ selectedDevice: device });
  },

  // Update device
  updateDevice: async (deviceId, updates): Promise<Device | null> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/v1/iot/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success && data.data?.device) {
        const updatedDevice = data.data.device;
        set((state) => ({
          devices: state.devices.map((d) =>
            d.device_id === deviceId ? updatedDevice : d
          ),
          selectedDevice:
            state.selectedDevice?.device_id === deviceId
              ? updatedDevice
              : state.selectedDevice,
          isLoading: false,
          lastUpdated: new Date(),
        }));
        return updatedDevice;
      } else {
        set({
          isLoading: false,
          error: data.message || 'Failed to update device',
        });
        return null;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
      return null;
    }
  },

  // Delete device
  deleteDevice: async (deviceId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/v1/iot/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        set((state) => ({
          devices: state.devices.filter((d) => d.device_id !== deviceId),
          selectedDevice:
            state.selectedDevice?.device_id === deviceId
              ? null
              : state.selectedDevice,
          isLoading: false,
          lastUpdated: new Date(),
        }));
        return true;
      } else {
        set({
          isLoading: false,
          error: data.message || 'Failed to delete device',
        });
        return false;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred',
      });
      return false;
    }
  },

  // Refresh devices
  refreshDevices: async (): Promise<void> => {
    set({ isRefreshing: true });
    try {
      await get().fetchDevices();
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Clear error
  clearError: (): void => {
    set({ error: null });
  },
}));

// Helper function to get token
async function getToken(): Promise<string> {
  try {
    // This should be replaced with actual token retrieval from auth store or storage
    return '';
  } catch (error) {
    return '';
  }
}
