/**
 * Custom Hook: Solar Forecast
 * Fetches and manages solar generation predictions
 */

import { useState, useEffect, useCallback } from 'react';
import mlService, { SolarForecast } from '../api/mlService';

export const useSolarForecast = (deviceId: string | null, days: number = 7) => {
  const [forecast, setForecast] = useState<SolarForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    if (!deviceId) {
      setForecast(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await mlService.getSolarForecast(deviceId, days);
      setForecast(data);
    } catch (err: any) {
      console.error('Error fetching solar forecast:', err);
      setError(err.message || 'Failed to fetch forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [deviceId, days]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const refetch = () => {
    fetchForecast();
  };

  return { forecast, loading, error, refetch };
};

export default useSolarForecast;
