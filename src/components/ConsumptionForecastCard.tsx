/**
 * Consumption Forecast Card Component
 * Displays energy consumption predictions
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useConsumptionForecast from '../../hooks/useConsumptionForecast';
import { safeToFixed } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

interface ConsumptionForecastCardProps {
  days?: number;
  onPress?: () => void;
}

const ConsumptionForecastCard: React.FC<ConsumptionForecastCardProps> = ({
  days = 7,
  onPress,
}) => {
  const { forecast, loading, error, refetch } = useConsumptionForecast(days);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
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
        <Text style={styles.noDataText}>No consumption forecast available</Text>
      </View>
    );
  }

  const chartData = {
    labels: forecast.forecasts.map((f) =>
      new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        data: forecast.forecasts.map((f) => f.predicted),
      },
    ],
  };

  const avgDaily = forecast.totalPredicted / forecast.forecasts.length;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="home-lightning-bolt" size={24} color="#8B5CF6" />
          <Text style={styles.title}>{days}-Day Consumption Forecast</Text>
        </View>
        <View style={styles.badge}>
          <Icon name="brain" size={16} color="#8B5CF6" />
          <Text style={styles.badgeText}>ML</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          yAxisSuffix=" kWh"
          chartConfig={{
            backgroundColor: '#7C3AED',
            backgroundGradientFrom: '#7C3AED',
            backgroundGradientTo: '#A78BFA',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
            },
          }}
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          showValuesOnTopOfBars={true}
        />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Forecast</Text>
          <Text style={styles.statValue}>{forecast.totalPredicted.toFixed(1)} kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Daily Average</Text>
          <Text style={styles.statValue}>{avgDaily.toFixed(1)} kWh</Text>
        </View>
        {forecast.metadata.householdSize && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Household</Text>
            <Text style={styles.statValue}>{forecast.metadata.householdSize} people</Text>
          </View>
        )}
      </View>

      {/* Daily List */}
      <View style={styles.dailyList}>
        {forecast.forecasts.map((day, idx) => {
          const date = new Date(day.date);
          const maxValue = Math.max(...forecast.forecasts.map(f => f.predicted));
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
                      width: `${(day.predicted / maxValue) * 100}%`,
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
        {forecast.metadata.daysOfHistory && (
          <Text style={styles.footerText}>
            Based on {forecast.metadata.daysOfHistory} days of history
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
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
    backgroundColor: '#8B5CF6',
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

export default ConsumptionForecastCard;
