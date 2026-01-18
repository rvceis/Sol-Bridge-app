/**
 * Custom Hook: Anomaly Alerts
 * Manages anomaly detection alerts
 */

import { useState, useEffect, useCallback } from 'react';
import mlService, { AnomalyAlert } from '../api/mlService';

export const useAnomalyAlerts = (autoRefreshInterval?: number) => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mlService.getAnomalyAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error('Error fetching anomaly alerts:', err);
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      await mlService.resolveAlert(alertId);
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
    } catch (err: any) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Optional auto-refresh
    if (autoRefreshInterval) {
      const interval = setInterval(fetchAlerts, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, autoRefreshInterval]);

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved);

  return {
    alerts,
    unresolvedAlerts,
    criticalAlerts,
    loading,
    error,
    refetch: fetchAlerts,
    resolveAlert,
  };
};

export default useAnomalyAlerts;
