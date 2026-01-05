/**
 * Solar Energy Sharing Platform - Energy Screen
 * Energy production/consumption monitoring and analytics
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, gradients } from '../../theme';
import {
  useAuthStore,
  useEnergyStore,
  TimeRange,
  formatPower,
  formatEnergy,
} from '../../store';

const { width } = Dimensions.get('window');

const timeRanges: { key: TimeRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

// Simple chart bar component
const ChartBar: React.FC<{
  value: number;
  maxValue: number;
  label: string;
  color: string;
  isActive?: boolean;
}> = ({ value, maxValue, label, color, isActive }) => {
  const height = maxValue > 0 ? (value / maxValue) * 120 : 0;

  return (
    <View style={styles.chartBarContainer}>
      <View style={styles.chartBarWrapper}>
        <View
          style={[
            styles.chartBar,
            {
              height: Math.max(height, 4),
              backgroundColor: isActive ? color : color + '60',
            },
          ]}
        />
      </View>
      <Text style={[styles.chartLabel, isActive && styles.chartLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

const EnergyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const isHost = user?.role === 'host';

  const latestReading = useEnergyStore((state) => state.latestReading);
  const readings = useEnergyStore((state) => state.readings);
  const dailySummary = useEnergyStore((state) => state.dailySummary);
  const stats = useEnergyStore((state) => state.stats);
  const selectedTimeRange = useEnergyStore((state) => state.selectedTimeRange);
  const isLoading = useEnergyStore((state) => state.isRefreshing);
  const lastUpdated = useEnergyStore((state) => state.lastUpdated);

  const fetchLatestReading = useEnergyStore((state) => state.fetchLatestReading);
  const fetchHistory = useEnergyStore((state) => state.fetchHistory);
  const setTimeRange = useEnergyStore((state) => state.setTimeRange);
  const refresh = useEnergyStore((state) => state.refresh);

  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    fetchLatestReading();
    fetchHistory();
  }, [fetchLatestReading, fetchHistory]);

  const handleTimeRangeChange = async (range: TimeRange) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeRange(range);
  };

  // Generate chart data based on readings - uses real data only
  const chartData = React.useMemo(() => {
    if (selectedTimeRange === 'today') {
      // Hourly data for today
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${i}`,
        value: readings[i]?.powerOutput || 0,
      }));
    } else if (selectedTimeRange === 'week') {
      // Daily data for week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((day, i) => ({
        label: day,
        value: readings[i]?.powerOutput || 0,
      }));
    } else {
      // Weekly data for month
      return Array.from({ length: 4 }, (_, i) => ({
        label: `W${i + 1}`,
        value: readings[i]?.powerOutput || 0,
      }));
    }
  }, [selectedTimeRange, readings]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={isHost ? gradients.solarSunrise.colors : gradients.electricFlow.colors}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isHost ? 'Energy Production' : 'Energy Usage'}
          </Text>
          <TouchableOpacity style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={22} color={colors.neutral.white} />
          </TouchableOpacity>
        </View>

        {/* Live Status */}
        <View style={styles.liveContainer}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.lastUpdated}>
            Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}
          </Text>
        </View>

        {/* Current Power */}
        <View style={styles.currentPowerContainer}>
          <Ionicons
            name={isHost ? 'sunny' : 'flash'}
            size={32}
            color={colors.neutral.white}
          />
          <Text style={styles.currentPowerValue}>
            {formatPower(latestReading?.powerOutput || 0)}
          </Text>
          <Text style={styles.currentPowerLabel}>Current Power</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === key && styles.timeRangeButtonActive,
              ]}
              onPress={() => handleTimeRangeChange(key)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  selectedTimeRange === key && styles.timeRangeTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {isHost ? 'Production' : 'Consumption'} Overview
            </Text>
            <Text style={styles.chartTotal}>
              Total: {formatEnergy(stats.totalProduced * 1000)}
            </Text>
          </View>

          <View style={styles.chart}>
            {chartData.slice(0, selectedTimeRange === 'today' ? 12 : chartData.length).map((item, index) => (
              <ChartBar
                key={index}
                value={item.value}
                maxValue={maxChartValue}
                label={item.label}
                color={isHost ? colors.primary.main : colors.secondary.main}
                isActive={selectedBarIndex === index}
              />
            ))}
          </View>

          {selectedTimeRange === 'today' && (
            <Text style={styles.chartNote}>Showing first 12 hours • Scroll for more</Text>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success.light }]}>
              <Ionicons name="trending-up" size={20} color={colors.success.main} />
            </View>
            <Text style={styles.statValue}>{formatEnergy(stats.totalProduced * 1000)}</Text>
            <Text style={styles.statLabel}>Total {isHost ? 'Produced' : 'Used'}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary.light }]}>
              <Ionicons name="flash" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.statValue}>{formatPower(stats.peakOutput)}</Text>
            <Text style={styles.statLabel}>Peak Power</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary.light }]}>
              <Ionicons name="speedometer" size={20} color={colors.secondary.main} />
            </View>
            <Text style={styles.statValue}>{stats.avgEfficiency.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Avg Efficiency</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.info.light }]}>
              <Ionicons name="leaf" size={20} color={colors.info.main} />
            </View>
            <Text style={styles.statValue}>
              {((stats.totalProduced * 0.85) / 1000).toFixed(1)} kg
            </Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>

        {/* Device Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Status</Text>

          <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <View style={[styles.deviceIcon, { backgroundColor: colors.success.light }]}>
                  <Ionicons name="hardware-chip" size={20} color={colors.success.main} />
                </View>
                <View>
                  <Text style={styles.deviceName}>Solar Panel Array</Text>
                  <View style={styles.deviceStatusRow}>
                    <View style={styles.onlineIndicator} />
                    <Text style={styles.deviceStatus}>Online</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.deviceMoreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.deviceStats}>
              <View style={styles.deviceStatItem}>
                <Text style={styles.deviceStatLabel}>Voltage</Text>
                <Text style={styles.deviceStatValue}>
                  {latestReading?.voltage?.toFixed(1) || '0'} V
                </Text>
              </View>
              <View style={styles.deviceStatItem}>
                <Text style={styles.deviceStatLabel}>Current</Text>
                <Text style={styles.deviceStatValue}>
                  {latestReading?.current?.toFixed(2) || '0'} A
                </Text>
              </View>
              <View style={styles.deviceStatItem}>
                <Text style={styles.deviceStatLabel}>Temperature</Text>
                <Text style={styles.deviceStatValue}>
                  {latestReading?.temperature?.toFixed(1) || '0'}°C
                </Text>
              </View>
              <View style={styles.deviceStatItem}>
                <Text style={styles.deviceStatLabel}>Battery</Text>
                <Text style={styles.deviceStatValue}>
                  {latestReading?.batteryLevel?.toFixed(0) || '0'}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.textStyles.h2,
    color: colors.neutral.white,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.main + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginRight: spacing.xs,
  },
  liveText: {
    ...typography.textStyles.caption,
    color: colors.success.main,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lastUpdated: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.7,
  },
  currentPowerContainer: {
    alignItems: 'center',
  },
  currentPowerValue: {
    ...typography.textStyles.display,
    color: colors.neutral.white,
    marginTop: spacing.xs,
  },
  currentPowerLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.neutral.white,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  chartTotal: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 2,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    ...typography.textStyles.tiny,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  chartLabelActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  chartNote: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2 - spacing.sm / 2,
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceName: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginRight: spacing.xs,
  },
  deviceStatus: {
    ...typography.textStyles.caption,
    color: colors.success.main,
  },
  deviceMoreButton: {
    padding: spacing.xs,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  deviceStatItem: {
    alignItems: 'center',
  },
  deviceStatLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  deviceStatValue: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default EnergyScreen;
