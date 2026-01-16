/**
 * Wallet Top-up Screen - Razorpay Payment Integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme';
import { paymentService } from '../../services/paymentService';
import { notificationService } from '../../services/notificationService';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function TopUpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const fetchBalance = useWalletStore((state) => state.fetchBalance);
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string>('');

  useEffect(() => {
    loadRazorpayKey();
  }, []);

  const loadRazorpayKey = async () => {
    try {
      const key = await paymentService.getRazorpayKey();
      setRazorpayKey(key);
    } catch (error) {
      console.error('Error loading Razorpay key:', error);
    }
  };

  const selectQuickAmount = async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value.toString());
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);

    // Validation
    if (!topUpAmount || topUpAmount < 10) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₹10');
      return;
    }

    if (topUpAmount > 50000) {
      Alert.alert('Invalid Amount', 'Maximum top-up amount is ₹50,000');
      return;
    }

    if (!razorpayKey) {
      Alert.alert('Error', 'Payment gateway not configured');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Step 1: Create order on backend
      const orderData = await paymentService.createTopupOrder(topUpAmount);
      console.log('[TopUp] Order created:', orderData.orderId);

      // Step 2: Open Razorpay Checkout
      const options = {
        description: 'Wallet Top-up',
        image: 'https://your-logo-url.com/logo.png', // Replace with your logo
        currency: orderData.currency,
        key: razorpayKey,
        amount: orderData.amount * 100, // Amount in paise
        name: 'Solar Sharing Platform',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.fullName || '',
        },
        theme: { color: colors.primary.main },
      };

      const data = await RazorpayCheckout.open(options);
      console.log('[TopUp] Payment successful:', data);

      // Step 3: Verify payment on backend
      await verifyPayment(data);
    } catch (error: any) {
      console.error('[TopUp] Payment error:', error);
      
      if (error.code === 2) {
        // User cancelled payment
        console.log('[TopUp] Payment cancelled by user');
      } else {
        Alert.alert('Payment Failed', error.description || 'Something went wrong');
        await notificationService.showPaymentFailure(error.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData: any) => {
    try {
      setLoading(true);

      const verification = await paymentService.verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      if (verification.success) {
        // Show success notification
        await notificationService.showPaymentSuccess(parseFloat(amount));
        
        // Refresh wallet balance
        await fetchBalance();

        Alert.alert(
          'Success! 🎉',
          `₹${amount} has been added to your wallet`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('[TopUp] Verification error:', error);
      Alert.alert('Verification Failed', 'Please contact support if amount was deducted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.label}>Enter Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.text.disabled}
              editable={!loading}
            />
          </View>
          <Text style={styles.hint}>Min: ₹10 • Max: ₹50,000</Text>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          <Text style={styles.label}>Quick Select</Text>
          <View style={styles.quickButtonsRow}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickButton,
                  amount === value.toString() && styles.quickButtonActive,
                ]}
                onPress={() => selectQuickAmount(value)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    amount === value.toString() && styles.quickButtonTextActive,
                  ]}
                >
                  ₹{value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>
            Secure payment powered by Razorpay
          </Text>
        </View>

        {/* Test Mode Banner (only in development) */}
        {__DEV__ && (
          <View style={styles.testBanner}>
            <Ionicons name="information-circle" size={20} color={colors.warning.main} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.testBannerTitle}>Test Mode</Text>
              <Text style={styles.testBannerText}>
                Use test card: 4111 1111 1111 1111{'\n'}
                CVV: Any 3 digits • Expiry: Any future date
              </Text>
            </View>
          </View>
        )}

        {/* Top Up Button */}
        <TouchableOpacity
          style={[
            styles.topUpButton,
            (!amount || loading) && styles.topUpButtonDisabled,
          ]}
          onPress={handleTopUp}
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="wallet" size={20} color="#FFF" />
              <Text style={styles.topUpButtonText}>
                Add ₹{amount || '0'} to Wallet
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
  },
  amountSection: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencySymbol: {
    ...typography.textStyles.h1,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.textStyles.h1,
    color: colors.text.primary,
  },
  hint: {
    ...typography.textStyles.caption,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
  quickAmounts: {
    marginBottom: spacing.xl,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  quickButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  quickButtonTextActive: {
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary.main,
    marginLeft: spacing.sm,
    flex: 1,
  },
  testBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warning.light,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  testBannerTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.warning.dark,
    marginBottom: 4,
  },
  testBannerText: {
    ...typography.textStyles.caption,
    color: colors.warning.dark,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  topUpButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  topUpButtonText: {
    ...typography.textStyles.button,
    color: '#FFF',
  },
});
