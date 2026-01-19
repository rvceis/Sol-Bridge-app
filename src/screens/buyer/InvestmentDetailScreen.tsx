/**
 * Investment Detail Screen - Detailed Investment Breakdown
 * Shows ROI calculator, contract terms, Razorpay payment integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import RazorpayCheckout from 'react-native-razorpay';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

interface InvestmentDetail {
  id: string;
  host_id: string;
  host_name: string;
  host_contact: string;
  host_rating: number;
  host_total_panels: number;
  location: string;
  latitude: number;
  longitude: number;
  available_capacity_kw: number;
  panel_price: number;
  installation_cost: number;
  total_investment: number;
  estimated_monthly_production_kwh: number;
  estimated_monthly_revenue: number;
  buyer_share_percentage: number;
  host_rent_monthly: number;
  platform_fee_percentage: number;
  estimated_monthly_profit: number;
  estimated_roi_percentage: number;
  payback_period_months: number;
  nearby_industries: {
    id: string;
    name: string;
    distance_km: number;
    demand_kwh: number;
    price_per_kwh: number;
  }[];
  property_images: string[];
  structural_certificate_url: string;
  risk_score: number;
  ai_match_score: number;
  contract_duration_months: number;
  warranty_years: number;
  maintenance_included: boolean;
  insurance_included: boolean;
}

export default function InvestmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAuthStore((state) => state.user);
  
  const { opportunityId } = route.params as { opportunityId: string };

  const [detail, setDetail] = useState<InvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [opportunityId]);

  const loadDetail = async () => {
    try {
      const response = await apiClient.get(`/investments/opportunities/${opportunityId}`);
      setDetail(response.data);
      if (response.data.nearby_industries.length > 0) {
        setSelectedIndustry(response.data.nearby_industries[0].id);
      }
    } catch (error) {
      console.error('Failed to load investment detail:', error);
      Alert.alert('Error', 'Failed to load investment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!detail || !selectedIndustry) {
      Alert.alert('Error', 'Please select an industry buyer');
      return;
    }

    Alert.alert(
      'Confirm Investment',
      `Invest ₹${safeToFixed(detail.total_investment / 100000, 2)} Lakhs in ${detail.available_capacity_kw} kW solar panel at ${detail.location}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed to Payment', onPress: initiatePayment },
      ]
    );
  };

  const initiatePayment = async () => {
    if (!detail) return;

    try {
      setInvesting(true);

      // Create Razorpay order
      const orderResponse = await apiClient.post('/investments/create-order', {
        opportunity_id: opportunityId,
        industry_id: selectedIndustry,
        amount: detail.total_investment,
      });

      const { order_id, amount, currency } = orderResponse.data;

      // Open Razorpay payment
      const options = {
        description: `Solar Panel Investment - ${detail.available_capacity_kw} kW`,
        image: 'https://your-logo-url.com/logo.png',
        currency: currency,
        key: 'rzp_test_your_key_id', // Replace with actual key from backend
        amount: amount,
        name: 'Solar Sharing Platform',
        order_id: order_id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || '',
        },
        theme: { color: '#4CAF50' },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // Payment successful
          await verifyPayment(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
        })
        .catch((error: any) => {
          console.error('Payment failed:', error);
          Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed');
          setInvesting(false);
        });
    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create payment order');
      setInvesting(false);
    }
  };

  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const response = await apiClient.post('/investments/verify-payment', {
        order_id: orderId,
        payment_id: paymentId,
        signature: signature,
        opportunity_id: opportunityId,
        industry_id: selectedIndustry,
      });

      if (response.data.success) {
        Alert.alert(
          'Investment Successful! 🎉',
          `Your ${detail?.available_capacity_kw} kW solar panel investment is confirmed. Installation will begin within 7 days.`,
          [
            {
              text: 'View My Investments',
              onPress: () => navigation.navigate('BuyerDashboard' as never),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      Alert.alert('Verification Failed', 'Payment verification failed. Please contact support.');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading investment details...</Text>
      </View>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment Details</Text>
        <TouchableOpacity onPress={() => Alert.alert('Share', 'Share this opportunity')}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Property Images */}
        {detail.property_images.length > 0 && (
          <ScrollView horizontal pagingEnabled style={styles.imageCarousel}>
            {detail.property_images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.propertyImage} />
            ))}
          </ScrollView>
        )}

        {/* Main Info */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View style={styles.capacityBadge}>
              <Ionicons name="sunny" size={20} color="#FF9800" />
              <Text style={styles.capacityText}>{detail.available_capacity_kw} kW Solar Panel</Text>
            </View>
            {detail.ai_match_score >= 80 && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="star" size={14} color="#FFF" />
                <Text style={styles.recommendedText}>AI Recommended</Text>
              </View>
            )}
          </View>

          <Text style={styles.location}>{detail.location}</Text>

          <View style={styles.hostRow}>
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{detail.host_name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>{safeToFixed(detail.host_rating, 1)}</Text>
                <Text style={styles.hostPanels}>• {detail.host_total_panels} panels hosted</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Alert.alert('Contact Host', detail.host_contact)}
            >
              <Ionicons name="call" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Investment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Panel Cost</Text>
              <Text style={styles.summaryValue}>₹{safeToFixed(detail.panel_price / 100000, 2)}L</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Installation Cost</Text>
              <Text style={styles.summaryValue}>₹{safeToFixed(detail.installation_cost / 100000, 2)}L</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Investment</Text>
              <Text style={styles.totalValue}>₹{safeToFixed(detail.total_investment / 100000, 2)}L</Text>
            </View>
          </View>
        </View>

        {/* ROI Calculator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Returns</Text>
          <View style={styles.roiCard}>
            <View style={styles.roiHeader}>
              <Ionicons name="trending-up" size={28} color="#4CAF50" />
              <View style={styles.roiMain}>
                <Text style={styles.roiLabel}>Monthly Profit (Net)</Text>
                <Text style={styles.roiValue}>₹{safeToFixed(detail.estimated_monthly_profit / 1000, 1)}K</Text>
              </View>
            </View>

            <View style={styles.roiMetrics}>
              <View style={styles.roiMetric}>
                <Text style={styles.roiMetricValue}>{safeToFixed(detail.estimated_roi_percentage, 1)}%</Text>
                <Text style={styles.roiMetricLabel}>Annual ROI</Text>
              </View>
              <View style={styles.roiMetric}>
                <Text style={styles.roiMetricValue}>{detail.payback_period_months}</Text>
                <Text style={styles.roiMetricLabel}>Months to Break-even</Text>
              </View>
            </View>

            <View style={styles.revenueBreakdown}>
              <Text style={styles.breakdownTitle}>Monthly Revenue Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Production</Text>
                <Text style={styles.breakdownValue}>{detail.estimated_monthly_production_kwh} kWh</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Revenue</Text>
                <Text style={styles.breakdownValue}>
                  ₹{safeToFixed(detail.estimated_monthly_revenue / 1000, 1)}K
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Your Share ({detail.buyer_share_percentage}%)</Text>
                <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>
                  ₹{safeToFixed((detail.estimated_monthly_revenue * detail.buyer_share_percentage) / 100000, 1)}K
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Host Rent</Text>
                <Text style={styles.breakdownValue}>-₹{safeToFixed(detail.host_rent_monthly / 1000, 1)}K</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Platform Fee ({detail.platform_fee_percentage}%)</Text>
                <Text style={styles.breakdownValue}>
                  -₹{safeToFixed((detail.estimated_monthly_revenue * detail.platform_fee_percentage) / 100000, 1)}K
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.totalLabel}>Net Monthly Profit</Text>
                <Text style={[styles.totalValue, { color: '#4CAF50' }]}>
                  ₹{safeToFixed(detail.estimated_monthly_profit / 1000, 1)}K
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nearby Industries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Industry Buyer</Text>
          <Text style={styles.sectionDescription}>Choose which industry will buy your solar energy</Text>

          {detail.nearby_industries.map((industry) => (
            <TouchableOpacity
              key={industry.id}
              style={[
                styles.industryCard,
                selectedIndustry === industry.id && styles.industryCardSelected,
              ]}
              onPress={() => setSelectedIndustry(industry.id)}
            >
              <View style={styles.industryHeader}>
                <View style={styles.industryInfo}>
                  <Text style={styles.industryName}>{industry.name}</Text>
                  <View style={styles.industryMeta}>
                    <Ionicons name="location" size={12} color="#666" />
                    <Text style={styles.industryDistance}>{industry.distance_km} km away</Text>
                  </View>
                </View>
                {selectedIndustry === industry.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                )}
              </View>

              <View style={styles.industryMetrics}>
                <View style={styles.industryMetric}>
                  <Text style={styles.industryMetricLabel}>Daily Demand</Text>
                  <Text style={styles.industryMetricValue}>{industry.demand_kwh} kWh</Text>
                </View>
                <View style={styles.industryMetric}>
                  <Text style={styles.industryMetricLabel}>Offering</Text>
                  <Text style={[styles.industryMetricValue, { color: '#4CAF50' }]}>
                    ₹{safeToFixed(industry.price_per_kwh, 2)}/kWh
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map View */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: detail.latitude,
                longitude: detail.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker
                coordinate={{ latitude: detail.latitude, longitude: detail.longitude }}
                title={detail.location}
              />
            </MapView>
          </View>
        </View>

        {/* Contract Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Terms</Text>
          <View style={styles.termsCard}>
            <View style={styles.termRow}>
              <Ionicons name="calendar" size={18} color="#666" />
              <Text style={styles.termText}>Contract Duration: {detail.contract_duration_months} months</Text>
            </View>
            <View style={styles.termRow}>
              <Ionicons name="shield-checkmark" size={18} color="#666" />
              <Text style={styles.termText}>Warranty: {detail.warranty_years} years</Text>
            </View>
            <View style={styles.termRow}>
              <Ionicons name="construct" size={18} color="#666" />
              <Text style={styles.termText}>
                Maintenance: {detail.maintenance_included ? 'Included' : 'Not Included'}
              </Text>
            </View>
            <View style={styles.termRow}>
              <Ionicons name="umbrella" size={18} color="#666" />
              <Text style={styles.termText}>
                Insurance: {detail.insurance_included ? 'Included' : 'Not Included'}
              </Text>
            </View>
            {detail.structural_certificate_url && (
              <TouchableOpacity
                style={styles.certificateButton}
                onPress={() => Alert.alert('Certificate', 'Open structural certificate')}
              >
                <Ionicons name="document-text" size={16} color="#007AFF" />
                <Text style={styles.certificateText}>View Structural Certificate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskLabel}>Overall Risk Score</Text>
              <Text
                style={[
                  styles.riskScore,
                  {
                    color:
                      detail.risk_score < 30 ? '#4CAF50' : detail.risk_score < 60 ? '#FF9800' : '#F44336',
                  },
                ]}
              >
                {detail.risk_score}/100
              </Text>
            </View>
            <View style={styles.riskBar}>
              <View
                style={[
                  styles.riskFill,
                  {
                    width: `${detail.risk_score}%`,
                    backgroundColor:
                      detail.risk_score < 30 ? '#4CAF50' : detail.risk_score < 60 ? '#FF9800' : '#F44336',
                  },
                ]}
              />
            </View>
            <Text style={styles.riskDescription}>
              {detail.risk_score < 30
                ? 'Low risk - Excellent investment opportunity with stable returns'
                : detail.risk_score < 60
                ? 'Medium risk - Good opportunity with reasonable returns'
                : 'Higher risk - Consider diversifying your investment'}
            </Text>
          </View>
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Total Investment</Text>
          <Text style={styles.priceValue}>₹{safeToFixed(detail.total_investment / 100000, 2)}L</Text>
        </View>
        <TouchableOpacity
          style={[styles.investButton, investing && styles.investButtonDisabled]}
          onPress={handleInvest}
          disabled={investing}
        >
          {investing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.investButtonText}>Invest Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  scrollView: { flex: 1 },
  imageCarousel: { height: 250 },
  propertyImage: { width: Dimensions.get('window').width, height: 250 },
  section: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  sectionDescription: { fontSize: 13, color: '#666', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  capacityText: { fontSize: 16, fontWeight: '700', color: '#FF9800' },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  recommendedText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  location: { fontSize: 16, color: '#666', marginBottom: 16 },
  hostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
  hostInfo: { flex: 1 },
  hostLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  hostName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 13, color: '#666', marginLeft: 4 },
  hostPanels: { fontSize: 13, color: '#999', marginLeft: 4 },
  contactButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  summaryCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  roiCard: { backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50' },
  roiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  roiMain: { marginLeft: 12, flex: 1 },
  roiLabel: { fontSize: 13, color: '#666' },
  roiValue: { fontSize: 24, fontWeight: '700', color: '#4CAF50', marginTop: 4 },
  roiMetrics: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roiMetric: { flex: 1, alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10 },
  roiMetricValue: { fontSize: 22, fontWeight: '700', color: '#333' },
  roiMetricLabel: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },
  revenueBreakdown: { backgroundColor: '#FFF', padding: 12, borderRadius: 10 },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 13, color: '#666' },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  industryCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  industryCardSelected: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  industryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  industryInfo: { flex: 1 },
  industryName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  industryMeta: { flexDirection: 'row', alignItems: 'center' },
  industryDistance: { fontSize: 12, color: '#666', marginLeft: 4 },
  selectedBadge: {},
  industryMetrics: { flexDirection: 'row', gap: 12 },
  industryMetric: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 8 },
  industryMetricLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  industryMetricValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  termsCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12 },
  termRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  termText: { marginLeft: 12, fontSize: 14, color: '#333', flex: 1 },
  certificateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD', paddingVertical: 12, borderRadius: 10, marginTop: 8, gap: 8 },
  certificateText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  riskCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riskLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  riskScore: { fontSize: 20, fontWeight: '700' },
  riskBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  riskFill: { height: '100%' },
  riskDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE', elevation: 8 },
  priceInfo: {},
  priceLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  priceValue: { fontSize: 20, fontWeight: '700', color: '#333' },
  investButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, gap: 8 },
  investButtonDisabled: { backgroundColor: '#CCC' },
  investButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
