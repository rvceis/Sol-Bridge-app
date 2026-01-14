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

  useEffect(() => {
    loadTransactions();
  }, [activeTab]);

  const loadTransactions = async () => {
    try {
      const response = await marketplaceApi.getMyTransactions(activeTab);
      const data = response.data || [];
      setTransactions(data);
      
      // Calculate stats
      const totalEnergy = data.reduce((sum: number, t: Transaction) => sum + parseFloat(String(t.energy_amount_kwh)), 0);
      const totalAmount = data.reduce((sum: number, t: Transaction) => {
        if (activeTab === 'buyer') {
          return sum + parseFloat(String(t.total_price));
        } else {
          return sum + (parseFloat(String(t.total_price)) - parseFloat(String(t.platform_fee)));
        }
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
              {item.energy_amount_kwh.toFixed(2)} kWh
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {isBuyer ? 'Total Paid' : 'Earned'}
            </Text>
            <Text style={styles.priceAmount}>
              ₹{isBuyer ? item.total_price.toFixed(2) : (item.total_price - item.platform_fee).toFixed(2)}
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
                {item.energy_delivered_kwh.toFixed(2)} kWh delivered
              </Text>
            </View>
          )}

          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
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
              {transactions
                .reduce((sum, t) => sum + t.energy_amount_kwh, 0)
                .toFixed(1)}{' '}
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
              {transactions
                .reduce(
                  (sum, t) =>
                    sum + (activeTab === 'buyer' ? t.total_price : t.total_price - t.platform_fee),
                  0
                )
                .toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
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
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 8,
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
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partyDetails: {
    marginLeft: 12,
  },
  partyLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  priceRow: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 8,
  },
});
