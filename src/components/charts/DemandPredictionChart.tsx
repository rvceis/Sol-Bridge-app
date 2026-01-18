import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeToFixed } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface DayPrediction {
  date: string;
  day_of_week: string;
  predicted_energy_kwh: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  samples: number;
  price_forecast: number;
}

interface DemandPredictionData {
  location: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  predictions: DayPrediction[];
  statistics: {
    average_energy: number;
    price_range: [number, number];
    daily_avg: number;
    standard_deviation: number;
  };
  model_info: {
    methodology: string;
    data_points: number;
    confidence_calculation: string;
  };
}

interface DemandPredictionChartProps {
  latitude: number;
  longitude: number;
  days?: number;
}

const DemandPredictionChart: React.FC<DemandPredictionChartProps> = ({
  latitude,
  longitude,
  days = 7,
}) => {
  const [data, setData] = useState<DemandPredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [latitude, longitude, days]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/location/demand-prediction?latitude=${latitude}&longitude=${longitude}&days=${days}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch predictions');
      }
    } catch (err) {
      setError('Network error');
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'minus';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '#10b981';
      case 'decreasing':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  const getConfidenceBadgeStyle = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return { backgroundColor: '#d1fae5', color: '#047857' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      default:
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
    }
  };

  const getMaxEnergy = () => {
    if (!data?.predictions) return 0;
    return Math.max(...data.predictions.map(p => p.predicted_energy_kwh));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Unable to load predictions'}</Text>
      </View>
    );
  }

  const maxEnergy = getMaxEnergy();
  const stats = data.statistics;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Energy Demand Forecast</Text>
          <Text style={styles.subtitle}>
            {data.location.city}, {data.location.state}
          </Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg Daily</Text>
          <Text style={styles.statValue}>{safeToFixed(stats.daily_avg, 0)}</Text>
          <Text style={styles.statUnit}>kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Std Dev</Text>
          <Text style={styles.statValue}>{safeToFixed(stats.standard_deviation, 1)}</Text>
          <Text style={styles.statUnit}>kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Price Range</Text>
          <Text style={styles.statValue}>
            ${safeToFixed(stats.price_range[0], 2)}-${safeToFixed(stats.price_range[1], 2)}
          </Text>
          <Text style={styles.statUnit}>per kWh</Text>
        </View>
      </View>

      {/* Predictions Chart */}
      <Text style={styles.chartTitle}>7-Day Forecast</Text>
      <View style={styles.chartContainer}>
        {data.predictions.map((prediction, index) => {
          const barHeight = (prediction.predicted_energy_kwh / maxEnergy) * 150;
          const badgeStyle = getConfidenceBadgeStyle(prediction.confidence);

          return (
            <View key={index} style={styles.dayColumn}>
              {/* Confidence Badge */}
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: badgeStyle.backgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.confidenceText,
                    { color: badgeStyle.color },
                  ]}
                >
                  {prediction.confidence.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Trend Icon */}
              <View style={styles.trendIcon}>
                <Ionicons
                  name={getTrendIcon(prediction.trend)}
                  size={16}
                  color={getTrendColor(prediction.trend)}
                />
              </View>

              {/* Bar */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: getTrendColor(prediction.trend),
                    },
                  ]}
                />
              </View>

              {/* Energy Value */}
              <Text style={styles.energyValue}>
                {safeToFixed(prediction.predicted_energy_kwh, 0)}
              </Text>

              {/* Day Label */}
              <Text style={styles.dayLabel}>
                {prediction.day_of_week.slice(0, 3)}
              </Text>

              {/* Price */}
              <Text style={styles.priceLabel}>
                ${safeToFixed(prediction.price_forecast, 2)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Trend Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.legendText}>Increasing Demand</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="minus" size={16} color="#6366f1" />
          <Text style={styles.legendText}>Stable</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="trending-down" size={16} color="#ef4444" />
          <Text style={styles.legendText}>Decreasing</Text>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Forecast Insights</Text>
        
        {/* High/Low Days */}
        {(() => {
          const predictions = data.predictions;
          const highest = predictions.reduce((prev, current) =>
            current.predicted_energy_kwh > prev.predicted_energy_kwh ? current : prev
          );
          const lowest = predictions.reduce((prev, current) =>
            current.predicted_energy_kwh < prev.predicted_energy_kwh ? current : prev
          );

          return (
            <>
              <View style={styles.insightRow}>
                <Ionicons name="arrow-up-circle" size={20} color="#10b981" />
                <View style={styles.insightText}>
                  <Text style={styles.insightLabel}>Peak Demand</Text>
                  <Text style={styles.insightValue}>
                    {safeToFixed(highest.predicted_energy_kwh, 0)} kWh on {highest.day_of_week}
                  </Text>
                </View>
              </View>

              <View style={styles.insightRow}>
                <Ionicons name="arrow-down-circle" size={20} color="#ef4444" />
                <View style={styles.insightText}>
                  <Text style={styles.insightLabel}>Lowest Demand</Text>
                  <Text style={styles.insightValue}>
                    {safeToFixed(lowest.predicted_energy_kwh, 0)} kWh on {lowest.day_of_week}
                  </Text>
                </View>
              </View>

              <View style={styles.insightRow}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <View style={styles.insightText}>
                  <Text style={styles.insightLabel}>Data Quality</Text>
                  <Text style={styles.insightValue}>
                    {data.model_info.data_points} data points analyzed
                  </Text>
                </View>
              </View>
            </>
          );
        })()}
      </View>

      {/* Model Info */}
      <View style={styles.modelInfoContainer}>
        <Text style={styles.modelInfoTitle}>Forecast Methodology</Text>
        <Text style={styles.modelInfoText}>{data.model_info.methodology}</Text>
        <Text style={styles.modelInfoText}>{data.model_info.confidence_calculation}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  statUnit: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 240,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  confidenceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendIcon: {
    marginBottom: 8,
  },
  barContainer: {
    height: 150,
    width: 28,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  energyValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  insightsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  insightText: {
    marginLeft: 12,
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  modelInfoContainer: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  modelInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  modelInfoText: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 16,
  },
});

export default DemandPredictionChart;
