/**
 * Custom Hook: Consumption Forecast
 * Fetches and manages energy consumption predictions
 */

import { useState, useEffect, useCallback } from 'react';
import mlService, { ConsumptionForecast } from '../api/mlService';

export const useConsumptionForecast = (days: number = 7) => {
  const [forecast, setForecast] = useState<ConsumptionForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mlService.getConsumptionForecast(days);
      setForecast(data);
    } catch (err: any) {
      console.error('Error fetching consumption forecast:', err);
      setError(err.message || 'Failed to fetch forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const refetch = () => {
    fetchForecast();
  };

  return { forecast, loading, error, refetch };
};

export default useConsumptionForecast;
