import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

/**
 * ConsumptionForecast: Interactive consumption forecast chart
 */

interface Forecast {
  date: string;
  predicted: number;
  details?: any;
}

interface ConsumptionForecastProps {
  onRefresh?: () => void;
}

const ConsumptionForecast: React.FC<ConsumptionForecastProps> = ({ onRefresh }) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'daily' | 'hourly'>('daily');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/consumption-forecast?days=7');
      if (response.data?.data?.forecasts) {
        setForecasts(response.data.data.forecasts);
      }
    } catch (error) {
      console.error('Error loading forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatHour = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getMaxValue = () => {
    return Math.max(...forecasts.map(f => f.predicted), 1);
  };

  const getAverageConsumption = () => {
    if (forecasts.length === 0) return 0;
    return forecasts.reduce((sum, f) => sum + f.predicted, 0) / forecasts.length;
  };

  const getHourlyBreakdown = (dayIndex: number) => {
    const day = forecasts[dayIndex];
    if (!day?.details?.hourly) return [];
    return day.details.hourly;
  };

  const getTrend = () => {
    if (forecasts.length < 2) return 'stable';
    const first = forecasts.slice(0, 2).reduce((sum, f) => sum + f.predicted, 0) / 2;
    const last = forecasts.slice(-2).reduce((sum, f) => sum + f.predicted, 0) / 2;
    if (last > first * 1.1) return 'increasing';
    if (last < first * 0.9) return 'decreasing';
    return 'stable';
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  }

  const maxValue = getMaxValue();
  const avgConsumption = getAverageConsumption();
  const trend = getTrend();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="lightning-bolt" size={24} color="#2196F3" />
          <View>
            <Text style={styles.title}>Energy Consumption Forecast</Text>
            <Text style={styles.subtitle}>7-day prediction</Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadForecasts}>
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg Daily</Text>
          <Text style={styles.statValue}>{avgConsumption.toFixed(1)} kWh</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Trend</Text>
          <Text style={[styles.statValue, {
            color: trend === 'increasing' ? '#F44336' : trend === 'decreasing' ? '#4CAF50' : '#FF9800'
          }]}>
            {trend === 'increasing' ? '↑ Rising' : trend === 'decreasing' ? '↓ Falling' : '→ Stable'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Peak Day</Text>
          <Text style={styles.statValue}>
            {Math.max(...forecasts.map(f => f.predicted)).toFixed(1)} kWh
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxValue.toFixed(0)}</Text>
          <Text style={styles.yLabel}>{(maxValue * 0.75).toFixed(0)}</Text>
          <Text style={styles.yLabel}>{(maxValue * 0.5).toFixed(0)}</Text>
          <Text style={styles.yLabel}>{(maxValue * 0.25).toFixed(0)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chart}>
          <View style={styles.barChart}>
            {forecasts.map((forecast, idx) => {
              const percentage = (forecast.predicted / maxValue) * 100;
              const isSelected = selectedDay === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.barContainer,
                    isSelected && styles.barContainerSelected,
                  ]}
                  onPress={() => setSelectedDay(isSelected ? null : idx)}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(percentage, 5)}%`,
                        backgroundColor: isSelected ? '#1976D2' : '#64B5F6',
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{formatDate(forecast.date).split(' ')[0]}</Text>
                  <Text style={styles.barValue}>{forecast.predicted.toFixed(1)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Hourly Breakdown (if day selected) */}
      {selectedDay !== null && getHourlyBreakdown(selectedDay).length > 0 && (
        <View style={styles.hourlySection}>
          <Text style={styles.sectionTitle}>
            Hourly Breakdown - {formatDate(forecasts[selectedDay].date)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.hourlyChart}>
              {getHourlyBreakdown(selectedDay).map((hour: any, idx: number) => (
                <View key={idx} style={styles.hourContainer}>
                  <View
                    style={[
                      styles.hourBar,
                      {
                        height: Math.max((hour.consumption / (maxValue / 24)) * 100, 5),
                        backgroundColor: '#4CAF50',
                      },
                    ]}
                  />
                  <Text style={styles.hourLabel}>{hour.hour}h</Text>
                  <Text style={styles.hourValue}>{hour.consumption.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle" size={16} color="#2196F3" />
        <Text style={styles.footerText}>
          Updated hourly based on consumption patterns and time-of-use analysis
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
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    width: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    width: 40,
  },
  yLabel: {
    fontSize: 10,
    color: '#999',
  },
  chart: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: '100%',
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    flex: 1,
  },
  barContainerSelected: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    padding: 4,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#333',
  },
  hourlySection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  hourlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  hourContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 40,
  },
  hourBar: {
    width: 24,
    borderRadius: 2,
    marginBottom: 4,
  },
  hourLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  hourValue: {
    fontSize: 8,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    flex: 1,
  },
});

export default ConsumptionForecast;
