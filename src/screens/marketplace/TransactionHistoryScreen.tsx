import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { marketplaceApi } from '../../api/marketplaceService';
import { useResponsive } from '../../hooks/useResponsive';
import { safeToFixed } from '../../utils/formatters';

interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  energy_amount_kwh: number;
  price_per_kwh: number;
  total_price: number;
  platform_fee: number;
  payment_method_id: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  delivery_start?: string;
  delivery_end?: string;
  energy_delivered_kwh?: number;
  rating?: number;
  review?: string;
  created_at: string;
}

export default function TransactionHistoryScreen() {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalEnergy: 0,
    totalAmount: 0,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    header: {
      paddingHorizontal: responsive.screenPadding,
      paddingVertical: responsive.screenPadding,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    headerTitle: {
      fontSize: 22 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.screenPadding,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: '#007AFF',
    },
    tabText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#999',
      marginLeft: responsive.gridGap,
    },
    tabTextActive: {
      color: '#007AFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: responsive.screenPadding,
    },
    transactionCard: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: responsive.screenPadding,
      marginBottom: responsive.cardPadding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.cardPadding,
    },
    partyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    partyDetails: {
      marginLeft: responsive.cardPadding,
    },
    partyLabel: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginBottom: 2,
    },
    partyName: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.gridGap,
      paddingVertical: responsive.gridGap / 1.5,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11 * responsive.fontScale,
      fontWeight: '600',
      marginLeft: responsive.gridGap / 2,
      textTransform: 'capitalize',
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.cardPadding,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#F0F0F0',
    },
    energyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    energyText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginLeft: responsive.gridGap,
    },
    priceRow: {
      alignItems: 'flex-end',
    },
    priceLabel: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginBottom: 2,
    },
    priceAmount: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#4CAF50',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: responsive.cardPadding,
      gap: responsive.cardPadding,
    },
    dateText: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
    },
    deliveryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8F5E9',
      paddingHorizontal: responsive.gridGap,
      paddingVertical: responsive.gridGap / 2.5,
      borderRadius: 8,
    },
    deliveryText: {
      fontSize: 10 * responsive.fontScale,
      color: '#4CAF50',
      fontWeight: '600',
      marginLeft: responsive.gridGap / 2,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF8E1',
      paddingHorizontal: responsive.gridGap,
      paddingVertical: responsive.gridGap / 2.5,
      borderRadius: 8,
    },
    ratingText: {
      fontSize: 11 * responsive.fontScale,
      fontWeight: '600',
      color: '#F57C00',
      marginLeft: responsive.gridGap / 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.screenPadding * 5,
      paddingHorizontal: responsive.screenPadding * 2.5,
    },
    emptyTitle: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginTop: responsive.screenPadding,
      marginBottom: responsive.gridGap,
    },
    emptyText: {
      fontSize: 14 * responsive.fontScale,
      color: '#999',
      textAlign: 'center',
      marginBottom: responsive.screenPadding * 1.5,
    },
    emptyButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: responsive.screenPadding * 1.5,
      paddingVertical: responsive.cardPadding,
      borderRadius: 12,
    },
    emptyButtonText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#FFF',
    },
    statsBar: {
      flexDirection: 'row',
      backgroundColor: '#FFF',
      padding: responsive.screenPadding,
      borderTopWidth: 1,
      borderTopColor: '#EEE',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginBottom: responsive.gridGap,
    },
    statValue: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    statDivider: {
      width: 1,
      backgroundColor: '#EEE',
      marginHorizontal: responsive.gridGap,
    },
  });

  useEffect(() => {
    loadTransactions();
  }, [activeTab]);

  const loadTransactions = async () => {
    try {
      const response = await marketplaceApi.getMyTransactions(activeTab);
      const data = response.data || [];
      setTransactions(data);
      
      // Calculate stats
      const toNumber = (val: any) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : 0;
      };

      const totalEnergy = data.reduce((sum: number, t: Transaction) => sum + toNumber(t.energy_amount_kwh), 0);
      const totalAmount = data.reduce((sum: number, t: Transaction) => {
        const price = toNumber(t.total_price);
        const fee = toNumber(t.platform_fee);
        return sum + (activeTab === 'buyer' ? price : price - fee);
      }, 0);
      
      setStats({
        totalTransactions: data.length,
        totalEnergy,
        totalAmount,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
        return '#FF6B6B';
      case 'processing':
      case 'in_progress':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
      case 'failed':
        return 'close-circle';
      case 'processing':
      case 'in_progress':
        return 'sync';
      default:
        return 'help-circle';
    }
  };

  const renderTransactionCard = ({ item }: { item: Transaction }) => {
    const isBuyer = activeTab === 'buyer';
    const otherParty = isBuyer ? item.seller_name : item.buyer_name;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() =>
          navigation.navigate('TransactionDetail' as never, { transactionId: item.id } as never)
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.partyInfo}>
            <Ionicons
              name={isBuyer ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={24}
              color={isBuyer ? '#4CAF50' : '#2196F3'}
            />
            <View style={styles.partyDetails}>
              <Text style={styles.partyLabel}>{isBuyer ? 'Bought from' : 'Sold to'}</Text>
              <Text style={styles.partyName}>{otherParty}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={16}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.energyRow}>
            <Ionicons name="flash" size={20} color="#FF9800" />
            <Text style={styles.energyText}>
              {safeToFixed(item.energy_amount_kwh, 2)} kWh
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {isBuyer ? 'Total Paid' : 'Earned'}
            </Text>
            <Text style={styles.priceAmount}>
              ₹{isBuyer ? safeToFixed(item.total_price, 2) : safeToFixed(item.total_price - item.platform_fee, 2)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          {item.delivery_status === 'completed' && item.energy_delivered_kwh && (
            <View style={styles.deliveryBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.deliveryText}>
                {safeToFixed(item.energy_delivered_kwh, 2)} kWh delivered
              </Text>
            </View>
          )}

          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{safeToFixed(item.rating, 1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'buyer' ? 'cart-outline' : 'cash-outline'}
        size={64}
        color="#CCC"
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'buyer' ? 'Purchase' : 'Sale'} History
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'buyer'
          ? 'Start buying renewable energy from the marketplace'
          : 'List your energy to start earning'}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() =>
          navigation.navigate(
            activeTab === 'buyer' ? 'Marketplace' : 'CreateListing' as never
          )
        }
      >
        <Text style={styles.emptyButtonText}>
          {activeTab === 'buyer' ? 'Browse Marketplace' : 'Create Listing'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buyer' && styles.tabActive]}
          onPress={() => setActiveTab('buyer')}
        >
          <Ionicons
            name="arrow-down-circle"
            size={20}
            color={activeTab === 'buyer' ? '#4CAF50' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'buyer' && styles.tabTextActive]}>
            Purchases
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'seller' && styles.tabActive]}
          onPress={() => setActiveTab('seller')}
        >
          <Ionicons
            name="arrow-up-circle"
            size={20}
            color={activeTab === 'seller' ? '#2196F3' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'seller' && styles.tabTextActive]}>
            Sales
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Stats Summary */}
      {!loading && transactions.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Transactions</Text>
            <Text style={styles.statValue}>{transactions.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Energy</Text>
            <Text style={styles.statValue}>
              {safeToFixed(transactions
                .reduce((sum, t) => {
                  const num = Number(t.energy_amount_kwh);
                  return sum + (Number.isFinite(num) ? num : 0);
                }, 0), 1)}{' '}
              kWh
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              {activeTab === 'buyer' ? 'Total Spent' : 'Total Earned'}
            </Text>
            <Text style={styles.statValue}>
              ₹
              {safeToFixed(transactions
                .reduce(
                  (sum, t) => {
                    const price = Number(t.total_price);
                    const fee = Number(t.platform_fee);
                    const safePrice = Number.isFinite(price) ? price : 0;
                    const safeFee = Number.isFinite(fee) ? fee : 0;
                    return sum + (activeTab === 'buyer' ? safePrice : safePrice - safeFee);
                  },
                  0
                ), 2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

