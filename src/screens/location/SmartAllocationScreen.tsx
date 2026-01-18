import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { locationApi } from '../../api/locationService';
import { marketplaceApi } from '../../api/marketplaceService';
import { safeToFixed } from '../../utils/formatters';

interface Allocation {
  listing_id: string;
  seller_id: string;
  seller_name: string;
  energy_kwh: number;
  price_per_kwh: number;
  total_price: number;
  distance_km: number;
  score: number;
  renewable_cert: boolean;
  city: string;
}

interface AllocationResult {
  success: boolean;
  requested_energy: number;
  allocated_energy: number;
  remaining_energy: number;
  allocation: Allocation[];
  summary: {
    total_cost: number;
    platform_fee: number;
    grand_total: number;
    average_price_per_kwh: number;
    num_sellers: number;
    avg_distance_km: number;
  };
}

export default function SmartAllocationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [result, setResult] = useState<AllocationResult | null>(null);

  // Form state
  const [energyNeeded, setEnergyNeeded] = useState('');
  const [maxDistance, setMaxDistance] = useState('100');
  const [maxPrice, setMaxPrice] = useState('');
  const [preferRenewable, setPreferRenewable] = useState(true);
  const [minRating, setMinRating] = useState('3');

  // Payment method state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getLocation();
    loadPaymentMethods();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to find nearby sellers');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      // Assuming payment methods endpoint exists
      const response = await marketplaceApi.getMyPaymentMethods?.() || { data: [] };
      setPaymentMethods(response.data || []);
      if (response.data?.length > 0) {
        setSelectedPaymentMethod(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleFindAllocation = async () => {
    if (!energyNeeded || parseFloat(energyNeeded) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter the energy amount you need');
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Please enable location access');
      return;
    }

    setLoading(true);
    try {
      const response = await locationApi.getOptimalAllocation(
        parseFloat(energyNeeded),
        location.latitude,
        location.longitude,
        {
          max_distance: maxDistance ? parseInt(maxDistance) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          prefer_renewable: preferRenewable,
          min_rating: minRating ? parseFloat(minRating) : undefined,
        }
      );

      setResult(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to find allocation';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseAll = async () => {
    if (!result || result.allocation.length === 0) return;
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${safeToFixed(result.allocated_energy, 2)} kWh from ${result.summary.num_sellers} sellers for ₹${safeToFixed(result.summary.grand_total, 2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPurchasing(true);
            try {
              // Purchase from each allocation
              for (const alloc of result.allocation) {
                await marketplaceApi.buyEnergy({
                  listing_id: alloc.listing_id,
                  energy_amount_kwh: alloc.energy_kwh,
                  payment_method_id: selectedPaymentMethod,
                });
              }

              Alert.alert(
                'Purchase Successful! 🎉',
                `You've purchased ${safeToFixed(result.allocated_energy, 2)} kWh of energy`,
                [{ text: 'View Transactions', onPress: () => navigation.goBack() }]
              );
              setResult(null);
              setEnergyNeeded('');
            } catch (error: any) {
              const message = error.response?.data?.error || 'Purchase failed';
              Alert.alert('Error', message);
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const renderAllocationCard = (alloc: Allocation, index: number) => (
    <View key={alloc.listing_id} style={styles.allocationCard}>
      <View style={styles.allocHeader}>
        <View style={styles.allocRank}>
          <Text style={styles.allocRankText}>#{index + 1}</Text>
        </View>
        <View style={styles.allocInfo}>
          <Text style={styles.allocSeller}>{alloc.seller_name}</Text>
          <Text style={styles.allocCity}>
            <Ionicons name="location" size={12} color="#999" /> {alloc.city || 'Unknown'}
          </Text>
        </View>
        <View style={styles.allocScore}>
          <Text style={styles.allocScoreValue}>{alloc.score}</Text>
          <Text style={styles.allocScoreLabel}>Score</Text>
        </View>
      </View>

      <View style={styles.allocDetails}>
        <View style={styles.allocDetail}>
          <Ionicons name="flash" size={16} color="#FF9800" />
          <Text style={styles.allocDetailValue}>{safeToFixed(alloc.energy_kwh, 2)} kWh</Text>
        </View>
        <View style={styles.allocDetail}>
          <Ionicons name="cash" size={16} color="#4CAF50" />
          <Text style={styles.allocDetailValue}>₹{alloc.price_per_kwh}/kWh</Text>
        </View>
        <View style={styles.allocDetail}>
          <Ionicons name="navigate" size={16} color="#2196F3" />
          <Text style={styles.allocDetailValue}>{alloc.distance_km} km</Text>
        </View>
        {alloc.renewable_cert && (
          <View style={styles.renewableBadge}>
            <Ionicons name="leaf" size={12} color="#4CAF50" />
            <Text style={styles.renewableText}>Renewable</Text>
          </View>
        )}
      </View>

      <View style={styles.allocTotal}>
        <Text style={styles.allocTotalLabel}>Total:</Text>
        <Text style={styles.allocTotalValue}>₹{safeToFixed(alloc.total_price, 2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Allocation</Text>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={16} color="#9C27B0" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="bulb" size={24} color="#FF9800" />
          <Text style={styles.infoText}>
            Our AI finds the optimal combination of sellers based on distance, price, ratings, and reliability to get you the best deal.
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Energy Requirements</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Energy Needed (kWh) *</Text>
            <TextInput
              style={styles.input}
              value={energyNeeded}
              onChangeText={setEnergyNeeded}
              placeholder="e.g., 100"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Max Distance (km)</Text>
              <TextInput
                style={styles.input}
                value={maxDistance}
                onChangeText={setMaxDistance}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Max Price (₹/kWh)</Text>
              <TextInput
                style={styles.input}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Any"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Min Seller Rating</Text>
              <TextInput
                style={styles.input}
                value={minRating}
                onChangeText={setMinRating}
                placeholder="3"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Prefer Renewable</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={preferRenewable}
                  onValueChange={setPreferRenewable}
                  trackColor={{ false: '#DDD', true: '#4CAF50' }}
                  thumbColor={preferRenewable ? '#FFF' : '#FFF'}
                />
                <Text style={styles.switchLabel}>{preferRenewable ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.findButton, loading && styles.findButtonDisabled]}
            onPress={handleFindAllocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.findButtonText}>Find Optimal Allocation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Recommended Allocation</Text>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Requested</Text>
                  <Text style={styles.summaryValue}>{result.requested_energy} kWh</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Allocated</Text>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                    {safeToFixed(result.allocated_energy, 2)} kWh
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sellers</Text>
                  <Text style={styles.summaryValue}>{result.summary.num_sellers}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Price</Text>
                  <Text style={styles.summaryValue}>₹{result.summary.average_price_per_kwh}/kWh</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Distance</Text>
                  <Text style={styles.summaryValue}>{result.summary.avg_distance_km} km</Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>₹{result.summary.total_cost}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Platform Fee (5%)</Text>
                  <Text style={styles.totalValue}>₹{result.summary.platform_fee}</Text>
                </View>
                <View style={[styles.totalItem, styles.grandTotal]}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>₹{result.summary.grand_total}</Text>
                </View>
              </View>
            </View>

            {/* Allocations List */}
            <Text style={styles.subsectionTitle}>Seller Breakdown</Text>
            {result.allocation.map((alloc, index) => renderAllocationCard(alloc, index))}

            {/* Purchase Button */}
            {result.allocation.length > 0 && (
              <TouchableOpacity
                style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
                onPress={handlePurchaseAll}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color="#FFF" />
                    <Text style={styles.purchaseButtonText}>
                      Purchase All (₹{result.summary.grand_total})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {!result.success && (
              <View style={styles.warningCard}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  Could not find enough energy. {safeToFixed(result.remaining_energy, 2)} kWh still needed. Try increasing the search radius.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C27B0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputRow: {
    flexDirection: 'row',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  findButtonDisabled: {
    opacity: 0.7,
  },
  findButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
  },
  totalValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  allocationCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  allocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  allocRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  allocRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  allocInfo: {
    flex: 1,
  },
  allocSeller: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  allocCity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  allocScore: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  allocScoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9C27B0',
  },
  allocScoreLabel: {
    fontSize: 9,
    color: '#999',
  },
  allocDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  allocDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allocDetailValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  renewableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  renewableText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  allocTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  allocTotalLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  allocTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
});
