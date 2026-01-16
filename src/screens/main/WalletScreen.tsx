/**
 * Solar Energy Sharing Platform - Wallet Screen
 * Balance, transactions, topup and withdraw
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, gradients } from '../../theme';
import {
  useWalletStore,
  formatCurrency,
  getTransactionTypeName,
  getStatusColor,
  isCredit,
} from '../../store';
import { Transaction } from '../../types';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'credit' | 'debit';

const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const wallet = useWalletStore((state) => state.wallet);
  const transactions = useWalletStore((state) => state.transactions);
  const recentActivity = useWalletStore((state) => state.recentActivity);
  const monthlySummary = useWalletStore((state) => state.monthlySummary);
  const isLoading = useWalletStore((state) => state.isRefreshing);
  const hasMore = useWalletStore((state) => state.hasMore);

  const fetchBalance = useWalletStore((state) => state.fetchBalance);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);
  const fetchMonthlySummary = useWalletStore((state) => state.fetchMonthlySummary);
  const loadMoreTransactions = useWalletStore((state) => state.loadMoreTransactions);
  const refresh = useWalletStore((state) => state.refresh);

  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    fetchBalance();
    fetchTransactions();
    fetchMonthlySummary();
  }, [fetchBalance, fetchTransactions, fetchMonthlySummary]);

  const handleFilterChange = async (filter: FilterType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterType(filter);

    const typeFilter = filter === 'all' ? undefined : filter;
    fetchTransactions({ type: typeFilter as any });
  };

  const handleTopup = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('TopUp' as never);
  };

  const handleWithdraw = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to withdraw screen
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = isCredit(item.type);

    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: isPositive ? colors.success.light : colors.error.light },
          ]}
        >
          <Ionicons
            name={isPositive ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={isPositive ? colors.success.main : colors.error.main}
          />
        </View>

        <View style={styles.transactionContent}>
          <Text style={styles.transactionTitle}>
            {getTransactionTypeName(item.type)}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isPositive ? colors.success.main : colors.error.main },
            ]}
          >
            {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Balance Card */}
      <LinearGradient
        colors={gradients.electricFlow.colors}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>INR</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>
          {formatCurrency(wallet?.balance || 0)}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTopup}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="add" size={20} color={colors.success.main} />
            </View>
            <Text style={styles.actionLabel}>Top Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleWithdraw}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="arrow-up" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconBg}>
              <Ionicons name="swap-horizontal" size={20} color={colors.secondary.main} />
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconBg}>
              <Ionicons name="receipt" size={20} color={colors.info.main} />
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Monthly Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>This Month</Text>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: colors.success.light }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="trending-up" size={18} color={colors.success.main} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(monthlySummary?.totalCredits || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Income</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.error.light }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="trending-down" size={18} color={colors.error.main} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(monthlySummary?.totalDebits || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Expenses</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.primary.light }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="flash" size={18} color={colors.primary.main} />
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(monthlySummary?.energySales || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Energy Sales</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        <View style={styles.filterTabs}>
          {(['all', 'credit', 'debit'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                filterType === filter && styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterType === filter && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptySubtitle}>
        Your transaction history will appear here
      </Text>
    </View>
  );

  const ListFooter = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMoreTransactions}
      >
        <Text style={styles.loadMoreText}>Load More</Text>
      </TouchableOpacity>
    );
  };

  // Use sample data if no transactions
  const displayTransactions = transactions.length > 0 ? transactions : [
    {
      id: '1',
      type: 'energy_sale',
      amount: 125.50,
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'topup',
      amount: 500.00,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      type: 'energy_purchase',
      amount: 75.25,
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ] as Transaction[];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={displayTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary.main}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    ...typography.textStyles.body,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  currencyBadge: {
    backgroundColor: colors.neutral.white + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  currencyText: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  balanceAmount: {
    ...typography.textStyles.display,
    color: colors.neutral.white,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  summaryContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
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
  summaryIcon: {
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  summaryLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.neutral.white,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  transactionDate: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    ...typography.textStyles.tiny,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default WalletScreen;
