import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { marketplaceApi } from '../../api/marketplaceService';
import { paymentService } from '../../services/paymentService';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';

interface ListingDetail {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  device_id: string;
  device_name: string;
  energy_amount_kwh: number;
  price_per_kwh: number;
  available_from: string;
  available_to: string;
  listing_type: string;
  status: string;
  min_purchase_kwh: number;
  renewable_cert: boolean;
  location_lat?: number;
  location_lon?: number;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  method_type: string;
  card_last4?: string;
  card_brand?: string;
  upi_id?: string;
  bank_name?: string;
  is_default: boolean;
}

export default function ListingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId } = route.params as { listingId: string };
  const user = useAuthStore((state) => state.user);
  const wallet = useWalletStore((state) => state.wallet);
  const fetchBalance = useWalletStore((state) => state.fetchBalance);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string>('');

  useEffect(() => {
    loadListingDetail();
    loadRazorpayKey();
    fetchBalance();
  }, []);

  const loadRazorpayKey = async () => {
    try {
      const key = await paymentService.getRazorpayKey();
      setRazorpayKey(key);
    } catch (error) {
      console.error('Error loading Razorpay key:', error);
    }
  };

  const loadListingDetail = async () => {
    try {
      const response = await marketplaceApi.getListingById(listingId);
      setListing(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load listing details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPress = async () => {
    if (!wallet) {
      await fetchBalance();
    }
    
    setPurchaseAmount(listing?.min_purchase_kwh?.toString() || '1');
    setShowBuyModal(true);
  };

  const handlePurchase = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid energy amount');
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (listing && amount < listing.min_purchase_kwh) {
      Alert.alert(
        'Minimum Purchase',
        `Minimum purchase amount is ${listing.min_purchase_kwh} kWh`
      );
      return;
    }

    if (listing && amount > listing.energy_amount_kwh) {
      Alert.alert(
        'Insufficient Energy',
        `Only ${listing.energy_amount_kwh} kWh available`
      );
      return;
    }

    const totalCost = amount * (listing?.price_per_kwh || 0);
    const walletBalance = wallet?.balance || 0;

    // Check if sufficient balance
    if (walletBalance < totalCost) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${totalCost.toFixed(2)} but have ₹${walletBalance.toFixed(2)}. Would you like to top up?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Top Up', 
            onPress: () => {
              setShowBuyModal(false);
              navigation.navigate('TopUp' as never);
            }
          },
        ]
      );
      return;
    }

    setPurchasing(true);
    try {
      // Create energy transaction
      const response = await marketplaceApi.buyEnergy({
        listing_id: listingId,
        energy_amount_kwh: amount,
      });

      // Show success notification
      await notificationService.scheduleNotification(
        'Purchase Successful! ⚡',
        `You bought ${amount} kWh of energy for ₹${totalCost.toFixed(2)}`,
        { type: 'energy_purchase', amount: totalCost }
      );

      // Refresh wallet balance
      await fetchBalance();

      Alert.alert(
        'Purchase Successful!',
        `You have successfully purchased ${amount} kWh of energy for ₹${totalCost.toFixed(2)}.`,
        [
          { text: 'View Transactions', onPress: () => navigation.navigate('Transactions' as never) },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
      setShowBuyModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to complete purchase';
      Alert.alert('Purchase Failed', errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!listing) {
    return null;
  }

  const totalPrice = listing.energy_amount_kwh * listing.price_per_kwh;
  const purchaseTotal = purchaseAmount
    ? parseFloat(purchaseAmount) * listing.price_per_kwh
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listing Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seller Info */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <Ionicons name="person-circle" size={48} color="#007AFF" />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller_name}</Text>
              <Text style={styles.sellerEmail}>{listing.seller_email}</Text>
            </View>
          </View>
          {listing.renewable_cert && (
            <View style={styles.certBadge}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.certText}>Renewable Certified</Text>
            </View>
          )}
        </View>

        {/* Energy Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="flash" size={24} color="#FF9800" />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Energy</Text>
              <Text style={styles.detailValue}>{listing.energy_amount_kwh} kWh</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={24} color="#4CAF50" />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Price per kWh</Text>
              <Text style={styles.detailValue}>₹{listing.price_per_kwh ? listing.price_per_kwh.toFixed(2) : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="pricetag" size={24} color="#2196F3" />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Price</Text>
              <Text style={styles.detailValue}>₹{totalPrice.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="arrow-down-circle" size={24} color="#9C27B0" />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Minimum Purchase</Text>
              <Text style={styles.detailValue}>{listing.min_purchase_kwh} kWh</Text>
            </View>
          </View>
        </View>

        {/* Device & Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.infoCard}>
            <Ionicons name="hardware-chip" size={20} color="#666" />
            <Text style={styles.infoText}>Device: {listing.device_name || 'Solar Panel'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="list" size={20} color="#666" />
            <Text style={styles.infoText}>
              Type: {listing.listing_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>
              Available: {new Date(listing.available_from).toLocaleDateString()} - {' '}
              {new Date(listing.available_to).toLocaleDateString()}
            </Text>
          </View>

          {listing.location_lat && listing.location_lon && (
            <View style={styles.infoCard}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoText}>
                Location: {listing.location_lat.toFixed(4)}, {listing.location_lon.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Buy Button */}
      <View style={styles.footer}>
        <View style={styles.priceFooter}>
          <Text style={styles.footerLabel}>Total Price</Text>
          <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.buyButton, listing.status !== 'active' && styles.buyButtonDisabled]}
          onPress={handleBuyPress}
          disabled={listing.status !== 'active'}
        >
          <Ionicons name="cart" size={20} color="#FFF" />
          <Text style={styles.buyButtonText}>
            {listing.status === 'active' ? 'Buy Energy' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Purchase Modal */}
      <Modal
        visible={showBuyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Purchase Energy</Text>
              <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Wallet Balance */}
              <View style={styles.walletCard}>
                <Ionicons name="wallet" size={24} color="#007AFF" />
                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Wallet Balance</Text>
                  <Text style={styles.walletBalance}>₹{(wallet?.balance || 0).toFixed(2)}</Text>
                </View>
                {wallet && wallet.balance < purchaseTotal && (
                  <TouchableOpacity 
                    style={styles.topUpButton}
                    onPress={() => {
                      setShowBuyModal(false);
                      navigation.navigate('TopUp' as never);
                    }}
                  >
                    <Text style={styles.topUpText}>Top Up</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Amount Input */}
              <Text style={styles.inputLabel}>Energy Amount (kWh)</Text>
              <TextInput
                style={styles.textInput}
                placeholder={`Min: ${listing.min_purchase_kwh} kWh`}
                keyboardType="numeric"
                value={purchaseAmount}
                onChangeText={setPurchaseAmount}
              />
              <Text style={styles.inputHint}>
                Available: {listing.energy_amount_kwh} kWh
              </Text>

              {/* Summary */}
              {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Purchase Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Energy Amount</Text>
                    <Text style={styles.summaryValue}>{purchaseAmount} kWh</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Price per kWh</Text>
                    <Text style={styles.summaryValue}>₹{listing.price_per_kwh ? listing.price_per_kwh.toFixed(2) : 'N/A'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Platform Fee (5%)</Text>
                    <Text style={styles.summaryValue}>₹{(purchaseTotal * 0.05).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryTotal]}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>₹{(purchaseTotal * 1.05).toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  sellerCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#666',
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  certText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  walletLabel: {
    fontSize: 12,
    color: '#666',
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 2,
  },
  topUpButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  topUpText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
});
