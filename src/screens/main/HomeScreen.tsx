/**
 * Solar Energy Sharing Platform - Home Screen
 * Main dashboard for both Host and Buyer roles
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, gradients } from '../../theme';
import { useAuthStore, useEnergyStore, useWalletStore, formatPower, formatCurrency } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';

const HomeScreen: React.FC = () => {
  const responsive = useResponsive();
  const { insets } = responsive;

  const user = useAuthStore((state) => state.user);
  const isHost = user?.role === 'host';

  const latestReading = useEnergyStore((state) => state.latestReading);
  const dailySummary = useEnergyStore((state) => state.dailySummary);
  const energyLoading = useEnergyStore((state) => state.isRefreshing);
  const fetchLatestReading = useEnergyStore((state) => state.fetchLatestReading);
  const fetchTodaySummary = useEnergyStore((state) => state.fetchTodaySummary);

  const wallet = useWalletStore((state) => state.wallet);
  const recentActivity = useWalletStore((state) => state.recentActivity);
  const walletLoading = useWalletStore((state) => state.isRefreshing);
  const fetchBalance = useWalletStore((state) => state.fetchBalance);

  const isRefreshing = energyLoading || walletLoading;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    fetchLatestReading();
    fetchTodaySummary();
    fetchBalance();
  }, [fetchLatestReading, fetchTodaySummary, fetchBalance]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFirstName = () => {
    return user?.fullName?.split(' ')[0] || 'User';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header Gradient */}
      <LinearGradient
        colors={isHost ? gradients.solarSunrise.colors : gradients.electricFlow.colors}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{getFirstName()} 👋</Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.neutral.white} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Main Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name={isHost ? 'sunny' : 'flash'}
                  size={20}
                  color={isHost ? colors.primary.main : colors.secondary.main}
                />
              </View>
              <Text style={styles.statLabel}>
                {isHost ? 'Producing Now' : 'Using Now'}
              </Text>
              <Text style={styles.statValue}>
                {formatPower(latestReading?.powerOutput || 0)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success.light }]}>
                <Ionicons name="wallet" size={20} color={colors.success.main} />
              </View>
              <Text style={styles.statLabel}>Balance</Text>
              <Text style={styles.statValue}>
                {formatCurrency(wallet?.balance || 0)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {isHost ? "Today's Production Goal" : "Today's Usage"}
              </Text>
              <Text style={styles.progressValue}>
                {dailySummary?.totalGeneration || 0} / {isHost ? '100' : '50'} kWh
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(((dailySummary?.totalGeneration || 0) / (isHost ? 100 : 50)) * 100, 100)}%`,
                    backgroundColor: isHost ? colors.primary.main : colors.secondary.main,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadData}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[colors.primary.light, colors.primary.main + '30']}
                style={styles.actionIconBg}
              >
                <Ionicons name={isHost ? 'analytics' : 'cart'} size={24} color={colors.primary.main} />
              </LinearGradient>
              <Text style={styles.actionLabel}>
                {isHost ? 'View Analytics' : 'Buy Energy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[colors.secondary.light, colors.secondary.main + '30']}
                style={styles.actionIconBg}
              >
                <Ionicons name="swap-horizontal" size={24} color={colors.secondary.main} />
              </LinearGradient>
              <Text style={styles.actionLabel}>Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[colors.success.light, colors.success.main + '30']}
                style={styles.actionIconBg}
              >
                <Ionicons name="add-circle" size={24} color={colors.success.main} />
              </LinearGradient>
              <Text style={styles.actionLabel}>
                {isHost ? 'Add Device' : 'Top Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[colors.info.light, colors.info.main + '30']}
                style={styles.actionIconBg}
              >
                <Ionicons name="people" size={24} color={colors.info.main} />
              </LinearGradient>
              <Text style={styles.actionLabel}>Community</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary.ultraLight }]}>
              <Ionicons name="sunny-outline" size={24} color={colors.primary.main} />
              <Text style={styles.summaryValue}>
                {dailySummary?.totalGeneration?.toFixed(1) || '0'} kWh
              </Text>
              <Text style={styles.summaryLabel}>
                {isHost ? 'Produced' : 'Purchased'}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.success.ultraLight }]}>
              <Ionicons name="trending-up-outline" size={24} color={colors.success.main} />
              <Text style={styles.summaryValue}>
                {formatCurrency(dailySummary?.totalShared ? dailySummary.totalShared * 5 : 0)}
              </Text>
              <Text style={styles.summaryLabel}>
                {isHost ? 'Earned' : 'Spent'}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.secondary.ultraLight }]}>
              <Ionicons name="flash-outline" size={24} color={colors.secondary.main} />
              <Text style={styles.summaryValue}>
                {dailySummary?.peakPower?.toFixed(1) || '0'} kW
              </Text>
              <Text style={styles.summaryLabel}>Peak Power</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Activity Items - From Real Data */}
          <View style={styles.activityList}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 3).map((activity: any, index: number) => (
                <View key={activity.id || index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { 
                    backgroundColor: activity.type === 'credit' ? colors.success.light : colors.error.light 
                  }]}>
                    <Ionicons 
                      name={activity.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                      size={16} 
                      color={activity.type === 'credit' ? colors.success.main : colors.error.main} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {activity.description || activity.type || 'Transaction'}
                    </Text>
                    <Text style={styles.activityTime}>
                      {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Recently'}
                    </Text>
                  </View>
                  <Text style={[styles.activityAmount, { 
                    color: activity.type === 'credit' ? colors.success.main : colors.error.main 
                  }]}>
                    {activity.type === 'credit' ? '+' : '-'}{formatCurrency(activity.amount || 0)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
                <Text style={styles.emptyActivitySubtext}>
                  Your transactions will appear here
                </Text>
              </View>
            )}
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
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerLeft: {},
  greeting: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  userName: {
    ...typography.textStyles.h2,
    color: colors.neutral.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error.main,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  statsCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  statValue: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border.light,
  },
  progressSection: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  progressValue: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    marginTop: -60,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: 'calc(50% - ' + spacing.md / 2 + 'px)', // Dynamic width for 2-column grid
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summaryLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  activityList: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  activityTime: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  activityAmount: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  emptyActivity: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyActivitySubtext: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});

export default HomeScreen;
