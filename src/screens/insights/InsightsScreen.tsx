import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import PanelHealthCard from './components/PanelHealthCard';
import ConsumptionForecast from './components/ConsumptionForecast';
import PerformanceMetrics from './components/PerformanceMetrics';
import AnomalyAlerts from './components/AnomalyAlerts';

/**
 * InsightsScreen: AI/ML Predictions and Analytics Dashboard
 * Week 2 MVP: Panel predictions, Consumption forecasts, Performance metrics
 */

interface PanelPrediction {
  date: string;
  predicted: number;
  details?: any;
}

interface ConsumptionPrediction {
  date: string;
  predicted: number;
  details?: any;
}

const InsightsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Panel predictions
  const [panelPredictions, setPanelPredictions] = useState<PanelPrediction[]>([]);
  const [panelConfidence, setPanelConfidence] = useState<number>(0);
  
  // Consumption predictions
  const [consumptionPredictions, setConsumptionPredictions] = useState<ConsumptionPrediction[]>([]);
  
  // Performance metrics
  const [todayGeneration, setTodayGeneration] = useState<number>(0);
  const [weeklyGeneration, setWeeklyGeneration] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(0);
  
  // Device info
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    loadInsightsData();
  }, []);

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      
      // Get user's first device
      const devicesResponse = await apiClient.get('/devices');
      if (devicesResponse.data?.devices?.length > 0) {
        const firstDevice = devicesResponse.data.devices[0];
        setDeviceId(firstDevice.device_id);
        
        // Load panel predictions
        await loadPanelPredictions(firstDevice.device_id);
      }
      
      // Load consumption predictions
      await loadConsumptionPredictions();
      
      // Load performance metrics
      await loadPerformanceMetrics();
      
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPanelPredictions = async (deviceId: string) => {
    try {
      const response = await apiClient.get(`/devices/${deviceId}/prediction?days=7`);
      if (response.data?.data) {
        setPanelPredictions(response.data.data.forecasts || []);
        setPanelConfidence(response.data.data.confidence || 0);
      }
    } catch (error) {
      console.error('Error loading panel predictions:', error);
    }
  };

  const loadConsumptionPredictions = async () => {
    try {
      const response = await apiClient.get('/users/consumption-forecast?days=7');
      if (response.data?.data) {
        setConsumptionPredictions(response.data.data.forecasts || []);
      }
    } catch (error) {
      console.error('Error loading consumption predictions:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      // Get latest IoT reading
      const latestResponse = await apiClient.get('/iot/latest');
      if (latestResponse.data?.reading) {
        setTodayGeneration(latestResponse.data.reading.power_kw || 0);
      }
      
      // Get weekly history
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const historyResponse = await apiClient.get(
        `/iot/history?startDate=${startDate}&endDate=${endDate}&interval=daily`
      );
      
      if (historyResponse.data?.readings) {
        const weeklyTotal = historyResponse.data.readings.reduce(
          (sum: number, r: any) => sum + (parseFloat(r.avg_power) || 0),
          0
        );
        setWeeklyGeneration(weeklyTotal);
        
        // Calculate efficiency (simple metric: actual vs predicted)
        if (panelPredictions.length > 0) {
          const predictedWeekly = panelPredictions.slice(0, 7).reduce(
            (sum, p) => sum + p.predicted,
            0
          );
          if (predictedWeekly > 0) {
            setEfficiency((weeklyTotal / predictedWeekly) * 100);
          }
        }
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsightsData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSubtitle}>Powered by machine learning</Text>
      </View>

      {/* New Components */}
      <View style={styles.componentsContainer}>
        {/* Performance Metrics Card */}
        <PerformanceMetrics onRefresh={onRefresh} />

        {/* Panel Health Card */}
        {deviceId && <PanelHealthCard deviceId={deviceId} onRefresh={onRefresh} />}

        {/* Consumption Forecast Card */}
        <ConsumptionForecast onRefresh={onRefresh} />

        {/* Anomaly Alerts Card */}
        <AnomalyAlerts onRefresh={onRefresh} />
      </View>

      {/* Old Performance Overview - Can be removed or kept for reference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="flash" size={32} color="#FF9800" />
            <Text style={styles.metricValue}>{todayGeneration.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>kW Now</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="trending-up" size={32} color="#4CAF50" />
            <Text style={styles.metricValue}>{weeklyGeneration.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>kWh This Week</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="speedometer" size={32} color="#2196F3" />
            <Text style={styles.metricValue}>{efficiency.toFixed(0)}%</Text>
            <Text style={styles.metricLabel}>Efficiency</Text>
          </View>
        </View>
      </View>

      {/* Panel Output Forecast */}
      {panelPredictions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Panel Output Forecast</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {(panelConfidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
          </View>
          <View style={styles.forecastContainer}>
            {panelPredictions.slice(0, 7).map((prediction, index) => (
              <View key={index} style={styles.forecastBar}>
                <Text style={styles.forecastDate}>{formatDate(prediction.date)}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${Math.min(100, (prediction.predicted / 10) * 100)}%`,
                        backgroundColor: index === 0 ? '#4CAF50' : '#81C784',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.forecastValue}>{prediction.predicted.toFixed(1)} kWh</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Consumption Forecast */}
      {consumptionPredictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumption Forecast</Text>
          <View style={styles.forecastContainer}>
            {consumptionPredictions.slice(0, 7).map((prediction, index) => (
              <View key={index} style={styles.forecastBar}>
                <Text style={styles.forecastDate}>{formatDate(prediction.date)}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${Math.min(100, (prediction.predicted / 15) * 100)}%`,
                        backgroundColor: index === 0 ? '#2196F3' : '#64B5F6',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.forecastValue}>{prediction.predicted.toFixed(1)} kWh</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DeviceManagement')}
        >
          <Ionicons name="settings" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Manage Devices</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Marketplace')}
        >
          <Ionicons name="storefront" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>View Marketplace</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#2196F3" />
        <Text style={styles.infoText}>
          Predictions are updated every 6 hours based on your historical data and weather patterns.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginVertical: 8,
  },
  componentsContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  confidenceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  forecastContainer: {
    marginTop: 8,
  },
  forecastBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastDate: {
    width: 60,
    fontSize: 12,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  forecastValue: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default InsightsScreen;
