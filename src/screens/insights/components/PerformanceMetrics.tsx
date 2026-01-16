import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

/**
 * PerformanceMetrics: Current system performance and efficiency
 */

interface Metrics {
  currentPower: number;
  dailyGeneration: number;
  weeklyGeneration: number;
  efficiency: number;
  systemStatus: 'optimal' | 'good' | 'fair' | 'poor';
  lastUpdated: string;
  estimatedMonthlyOutput: number;
  co2Saved: number;
}

interface PerformanceMetricsProps {
  onRefresh?: () => void;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ onRefresh }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get current IoT data
      const latestResponse = await apiClient.get('/iot/latest');
      const currentPower = latestResponse.data?.reading?.power_kw || 0;
      
      // Get daily history
      const today = new Date().toISOString().split('T')[0];
      const dailyResponse = await apiClient.get(`/iot/history?startDate=${today}&endDate=${today}&interval=hourly`);
      const dailyGeneration = dailyResponse.data?.readings?.reduce(
        (sum: number, r: any) => sum + (parseFloat(r.avg_power) || 0),
        0
      ) || 0;
      
      // Get weekly history
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weeklyResponse = await apiClient.get(`/iot/history?startDate=${weekStart}&endDate=${today}&interval=daily`);
      const weeklyGeneration = weeklyResponse.data?.readings?.reduce(
        (sum: number, r: any) => sum + (parseFloat(r.avg_power) || 0),
        0
      ) || 0;
      
      // Calculate efficiency (simple: compare to theoretical max)
      const theoretical = 5 * 24; // 5kW system * 24 hours = theoretical max
      const efficiency = (dailyGeneration / theoretical) * 100;
      
      // Determine system status
      let systemStatus: 'optimal' | 'good' | 'fair' | 'poor' = 'optimal';
      if (efficiency < 25) systemStatus = 'poor';
      else if (efficiency < 50) systemStatus = 'fair';
      else if (efficiency < 75) systemStatus = 'good';
      
      // Estimate monthly output
      const estimatedMonthlyOutput = dailyGeneration * 30;
      
      // Calculate CO2 saved (kg, assuming 0.5 kg per kWh)
      const co2Saved = estimatedMonthlyOutput * 0.5;
      
      setMetrics({
        currentPower,
        dailyGeneration: Math.max(0, dailyGeneration),
        weeklyGeneration: Math.max(0, weeklyGeneration),
        efficiency: Math.min(100, efficiency),
        systemStatus,
        lastUpdated: new Date().toLocaleTimeString(),
        estimatedMonthlyOutput,
        co2Saved,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'Optimal';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#FF9800" />
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Unable to load metrics</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(metrics.systemStatus);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="speedometer" size={24} color="#FF9800" />
          <View>
            <Text style={styles.title}>Performance Metrics</Text>
            <Text style={styles.subtitle}>Real-time system status</Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadMetrics}>
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* System Status Card */}
      <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>System Status</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>
            {getStatusLabel(metrics.systemStatus)}
          </Text>
          <Text style={styles.statusSubtitle}>Last updated: {metrics.lastUpdated}</Text>
        </View>
        <Ionicons
          name={metrics.systemStatus === 'optimal' ? 'checkmark-circle' : 'alert-circle'}
          size={40}
          color={statusColor}
        />
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Ionicons name="flash" size={28} color="#FF9800" />
          <Text style={styles.metricValue}>{metrics.currentPower.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>kW Now</Text>
        </View>
        <View style={styles.metricBox}>
          <Ionicons name="sunny" size={28} color="#FFC107" />
          <Text style={styles.metricValue}>{metrics.dailyGeneration.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>kWh Today</Text>
        </View>
        <View style={styles.metricBox}>
          <Ionicons name="trending-up" size={28} color="#4CAF50" />
          <Text style={styles.metricValue}>{metrics.weeklyGeneration.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>kWh Week</Text>
        </View>
        <View style={styles.metricBox}>
          <Ionicons name="speedometer" size={28} color="#2196F3" />
          <Text style={styles.metricValue}>{metrics.efficiency.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>% Efficiency</Text>
        </View>
      </View>

      {/* Projected Metrics */}
      <View style={styles.projectedSection}>
        <Text style={styles.sectionTitle}>Projected Output</Text>
        <View style={styles.projectedRow}>
          <View style={styles.projectedItem}>
            <Ionicons name="calendar" size={20} color="#2196F3" />
            <View style={styles.projectedContent}>
              <Text style={styles.projectedLabel}>This Month</Text>
              <Text style={styles.projectedValue}>
                {metrics.estimatedMonthlyOutput.toFixed(1)} kWh
              </Text>
            </View>
          </View>
          <View style={styles.projectedItem}>
            <Ionicons name="leaf" size={20} color="#4CAF50" />
            <View style={styles.projectedContent}>
              <Text style={styles.projectedLabel}>CO₂ Offset</Text>
              <Text style={styles.projectedValue}>
                {metrics.co2Saved.toFixed(1)} kg
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Efficiency Gauge */}
      <View style={styles.gaugeSection}>
        <Text style={styles.sectionTitle}>Efficiency Gauge</Text>
        <View style={styles.gauge}>
          <View style={styles.gaugeBackground}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${metrics.efficiency}%`,
                  backgroundColor: getStatusColor(metrics.systemStatus),
                },
              ]}
            />
          </View>
          <Text style={styles.gaugeText}>{metrics.efficiency.toFixed(1)}%</Text>
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabel}>0%</Text>
          <Text style={styles.gaugeLabel}>50%</Text>
          <Text style={styles.gaugeLabel}>100%</Text>
        </View>
      </View>

      {/* Performance Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Performance Tips</Text>
        {metrics.efficiency < 50 ? (
          <>
            <View style={styles.tipItem}>
              <Ionicons name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.tipText}>Low efficiency detected. Check for shading or dirt.</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.tipText}>Schedule panel cleaning for optimal performance.</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>System performing well. Keep up with maintenance.</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Monitor generation patterns for optimization opportunities.</Text>
            </View>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Metrics update every 15 minutes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  projectedSection: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  projectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectedContent: {
    marginLeft: 12,
    flex: 1,
  },
  projectedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  projectedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gaugeSection: {
    marginBottom: 16,
  },
  gauge: {
    marginBottom: 8,
  },
  gaugeBackground: {
    height: 12,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gaugeLabel: {
    fontSize: 10,
    color: '#999',
  },
  tipsSection: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#1565C0',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default PerformanceMetrics;
