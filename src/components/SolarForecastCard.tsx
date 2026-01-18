/**
 * Solar Forecast Card Component
 * Displays AI/ML solar generation predictions
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useSolarForecast from '../../hooks/useSolarForecast';

const screenWidth = Dimensions.get('window').width;

interface SolarForecastCardProps {
  deviceId: string;
  days?: number;
  onPress?: () => void;
}

const SolarForecastCard: React.FC<SolarForecastCardProps> = ({
  deviceId,
  days = 7,
  onPress,
}) => {
  const { forecast, loading, error, refetch } = useSolarForecast(deviceId, days);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading forecast...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!forecast || !forecast.forecasts || forecast.forecasts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No forecast data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: forecast.forecasts.map((f) =>
      new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        data: forecast.forecasts.map((f) => f.predicted),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const totalForecast = forecast.forecasts.reduce((sum, f) => sum + f.predicted, 0);
  const avgDaily = totalForecast / forecast.forecasts.length;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="white-balance-sunny" size={24} color="#3B82F6" />
          <Text style={styles.title}>{days}-Day Solar Forecast</Text>
        </View>
        <View style={styles.badge}>
          <Icon name="robot" size={16} color="#10B981" />
          <Text style={styles.badgeText}>AI</Text>
        </View>
      </View>

      {/* Confidence & Source */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Confidence</Text>
          <Text style={styles.metaValue}>
            {(forecast.confidence * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Source</Text>
          <Text style={styles.metaValue}>
            {forecast.metadata.source === 'ml-service' ? 'ML Model' : 'Rule-Based'}
          </Text>
        </View>
        {forecast.metadata.model && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Model</Text>
            <Text style={styles.metaValue}>
              {forecast.metadata.model.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          chartConfig={{
            backgroundColor: '#1E3A8A',
            backgroundGradientFrom: '#1E3A8A',
            backgroundGradientTo: '#3B82F6',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#fff',
            },
          }}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
        />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Forecast</Text>
          <Text style={styles.statValue}>{totalForecast.toFixed(1)} kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Daily Average</Text>
          <Text style={styles.statValue}>{avgDaily.toFixed(1)} kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Capacity</Text>
          <Text style={styles.statValue}>{forecast.metadata.capacity} kW</Text>
        </View>
      </View>

      {/* Daily Breakdown */}
      <View style={styles.dailyList}>
        {forecast.forecasts.map((day, idx) => {
          const date = new Date(day.date);
          return (
            <View key={idx} style={styles.dailyItem}>
              <View style={styles.dailyDate}>
                <Text style={styles.dayName}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={styles.dateNum}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.dailyBar}>
                <View
                  style={[
                    styles.dailyBarFill,
                    {
                      width: `${(day.predicted / forecast.metadata.capacity) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dailyValue}>{day.predicted.toFixed(1)} kWh</Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generated {new Date(forecast.generatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {forecast.metadata.dataPoints && (
          <Text style={styles.footerText}>
            Based on {forecast.metadata.dataPoints} data points
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  dailyList: {
    marginTop: 8,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dailyDate: {
    width: 60,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateNum: {
    fontSize: 10,
    color: '#6B7280',
  },
  dailyBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  dailyBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  dailyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    width: 70,
    textAlign: 'right',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginVertical: 2,
  },
});

export default SolarForecastCard;
