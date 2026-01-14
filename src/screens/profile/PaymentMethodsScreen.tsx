import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';

interface PaymentMethod {
  id: string;
  method_type: string;
  card_last4?: string;
  card_brand?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  upi_id?: string;
  bank_name?: string;
  account_last4?: string;
  wallet_provider?: string;
  is_default: boolean;
  is_verified: boolean;
}

export default function PaymentMethodsScreen() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(0);
  const [loading, setLoading] = React.useState(true);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await profileApi.getPaymentMethods();
      setPaymentMethods(response.data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.deletePaymentMethod(id);
              setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
              Alert.alert('Success', 'Payment method deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    let icon = 'card';
    let title = '';
    let subtitle = '';

    switch (method.method_type) {
      case 'card':
        icon = 'card';
        title = `•••• •••• •••• ${method.card_last4}`;
        subtitle = `${method.card_brand} • Expires ${method.card_expiry_month}/${method.card_expiry_year}`;
        break;
      case 'upi':
        icon = 'qr-code';
        title = method.upi_id || '';
        subtitle = 'UPI';
        break;
      case 'bank_transfer':
        icon = 'business';
        title = method.bank_name || '';
        subtitle = `Account ending in ${method.account_last4}`;
        break;
      case 'wallet':
        icon = 'wallet';
        title = method.wallet_provider || '';
        subtitle = 'Digital Wallet';
        break;
    }

    return (
      <TouchableOpacity key={method.id} style={styles.paymentCard}>
        <View style={[styles.cardIcon, { backgroundColor: method.method_type === 'card' ? '#4CAF50' : '#2196F3' }]}>
          <Ionicons name={icon as any} size={24} color="#FFF" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNumber}>{title}</Text>
          <Text style={styles.cardDetails}>{subtitle}</Text>
        </View>
        {method.is_default && (
          <View style={styles.cardBadge}>
            <Text style={styles.badgeText}>Default</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePaymentMethod(method.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[
        styles.header,
        { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.content}>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No payment methods added</Text>
            </View>
          ) : (
            paymentMethods.map(method => renderPaymentMethod(method))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert('Coming Soon', 'Add payment method feature will be available soon')}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cardBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});
