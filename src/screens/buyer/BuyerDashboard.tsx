/**
 * Buyer Dashboard - Investment Tracking
 * Shows all solar panel investments, production, revenue, and ROI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface Investment {
  id: string;
  host_id: string;
  host_name: string;
  host_location: { lat: number; lon: number; city: string; state: string };
  industry_id: string;
  industry_name: string;
  
  investment_amount: number;
  panel_capacity_kw: number;
  installation_date: string;
  
  monthly_production_kwh: number;
  monthly_revenue: number;
  host_rent_monthly: number;
  platform_commission: number;
  net_monthly_profit: number;
  
  total_earned_to_date: number;
  roi_percentage: number;
  payback_remaining_months: number;
  
  status: 'pending_installation' | 'active' | 'completed';
}

interface InvestmentSummary {
  total_investments: number;
  total_capacity_kw: number;
  total_monthly_revenue: number;
  total_net_profit: number;
  avg_roi: number;
  total_earned_lifetime: number;
  active_locations: number;
  total_production_kwh: number;
}

export default function BuyerDashboard() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get('/buyer/dashboard');
      setSummary(response.data.summary);
      setInvestments(response.data.investments);
    } catch (error) {
      console.error('Failed to load buyer dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your investments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Investments</Text>
          <Text style={styles.headerSubtitle}>Solar Panel Portfolio</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('InvestmentOpportunities' as never)}
        >
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="wallet" size={24} color="#2196F3" />
              <Text style={styles.summaryValue}>
                ₹{safeToFixed(summary?.total_net_profit || 0, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Monthly Profit</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.summaryValue}>
                {safeToFixed(summary?.avg_roi || 0, 1)}%
              </Text>
              <Text style={styles.summaryLabel}>Avg ROI</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="sunny" size={24} color="#FF9800" />
              <Text style={styles.summaryValue}>
                {safeToFixed(summary?.total_capacity_kw || 0, 0)} kW
              </Text>
              <Text style={styles.summaryLabel}>Total Capacity</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="location" size={24} color="#9C27B0" />
              <Text style={styles.summaryValue}>{summary?.active_locations || 0}</Text>
              <Text style={styles.summaryLabel}>Locations</Text>
            </View>
          </View>

          {/* Lifetime Earnings */}
          <View style={styles.lifetimeCard}>
            <View style={styles.lifetimeHeader}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
              <View style={styles.lifetimeText}>
                <Text style={styles.lifetimeLabel}>Total Earned (Lifetime)</Text>
                <Text style={styles.lifetimeValue}>
                  ₹{safeToFixed(summary?.total_earned_lifetime || 0, 0)}
                </Text>
              </View>
            </View>
            <Text style={styles.lifetimeSubtext}>
              From {summary?.total_production_kwh || 0} kWh produced
            </Text>
          </View>
        </View>

        {/* View Switcher */}
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.viewButton, selectedView === 'list' && styles.viewButtonActive]}
            onPress={() => setSelectedView('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={selectedView === 'list' ? '#FFF' : '#666'}
            />
            <Text
              style={[
                styles.viewButtonText,
                selectedView === 'list' && styles.viewButtonTextActive,
              ]}
            >
              List View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewButton, selectedView === 'map' && styles.viewButtonActive]}
            onPress={() => setSelectedView('map')}
          >
            <Ionicons
              name="map"
              size={20}
              color={selectedView === 'map' ? '#FFF' : '#666'}
            />
            <Text
              style={[
                styles.viewButtonText,
                selectedView === 'map' && styles.viewButtonTextActive,
              ]}
            >
              Map View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map View */}
        {selectedView === 'map' && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: investments[0]?.host_location.lat || 20.5937,
                longitude: investments[0]?.host_location.lon || 78.9629,
                latitudeDelta: 5,
                longitudeDelta: 5,
              }}
            >
              {investments.map((inv) => (
                <Marker
                  key={inv.id}
                  coordinate={{
                    latitude: inv.host_location.lat,
                    longitude: inv.host_location.lon,
                  }}
                  title={inv.host_name}
                  description={`${inv.panel_capacity_kw} kW | ₹${inv.net_monthly_profit}/mo`}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="sunny" size={24} color="#FF9800" />
                    <Text style={styles.markerText}>{inv.panel_capacity_kw} kW</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        )}

        {/* Investment List */}
        {selectedView === 'list' && (
          <View style={styles.investmentList}>
            <Text style={styles.sectionTitle}>My Solar Panels ({investments.length})</Text>
            {investments.map((inv) => (
              <TouchableOpacity
                key={inv.id}
                style={styles.investmentCard}
                onPress={() =>
                  navigation.navigate('InvestmentDetail' as never, { investmentId: inv.id } as never)
                }
              >
                {/* Status Badge */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          inv.status === 'active'
                            ? '#4CAF50'
                            : inv.status === 'pending_installation'
                            ? '#FF9800'
                            : '#999',
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {inv.status === 'active'
                        ? 'Active'
                        : inv.status === 'pending_installation'
                        ? 'Pending'
                        : 'Completed'}
                    </Text>
                  </View>
                  <Text style={styles.capacityBadge}>{inv.panel_capacity_kw} kW Panel</Text>
                </View>

                {/* Location Info */}
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText}>
                    {inv.host_location.city}, {inv.host_location.state}
                  </Text>
                </View>
                <Text style={styles.hostName}>Host: {inv.host_name}</Text>

                {/* Financial Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Investment</Text>
                    <Text style={styles.metricValue}>
                      ₹{(inv.investment_amount / 100000).toFixed(1)}L
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Monthly Profit</Text>
                    <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                      ₹{safeToFixed(inv.net_monthly_profit, 0)}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>ROI</Text>
                    <Text style={styles.metricValue}>
                      {safeToFixed(inv.roi_percentage, 1)}%
                    </Text>
                  </View>
                </View>

                {/* Production */}
                <View style={styles.productionRow}>
                  <Ionicons name="flash" size={16} color="#FF9800" />
                  <Text style={styles.productionText}>
                    {inv.monthly_production_kwh} kWh produced this month
                  </Text>
                </View>

                {/* Industry Buyer */}
                <View style={styles.buyerRow}>
                  <Ionicons name="business" size={16} color="#2196F3" />
                  <Text style={styles.buyerText}>Sold to: {inv.industry_name}</Text>
                </View>

                {/* Breakdown Button */}
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>View Detailed Breakdown</Text>
                  <Ionicons name="chevron-forward" size={18} color="#007AFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* Empty State */}
            {investments.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="sunny-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No Investments Yet</Text>
                <Text style={styles.emptyText}>
                  Start investing in solar panels to earn passive income
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('InvestmentOpportunities' as never)}
                >
                  <Text style={styles.emptyButtonText}>Find Opportunities</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  addButton: { padding: 4 },
  scrollView: { flex: 1 },
  summarySection: { padding: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  summaryCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 8 },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  lifetimeCard: {
    backgroundColor: '#FFF8E1',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lifetimeHeader: { flexDirection: 'row', alignItems: 'center' },
  lifetimeText: { marginLeft: 12, flex: 1 },
  lifetimeLabel: { fontSize: 13, color: '#666' },
  lifetimeValue: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 4 },
  lifetimeSubtext: { fontSize: 12, color: '#999', marginTop: 8 },
  viewSwitcher: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  viewButtonActive: { backgroundColor: '#007AFF' },
  viewButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  viewButtonTextActive: { color: '#FFF' },
  mapContainer: { height: 400, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center', backgroundColor: '#FFF', padding: 8, borderRadius: 8 },
  markerText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  investmentList: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  investmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  capacityBadge: { fontSize: 14, fontWeight: '700', color: '#FF9800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationText: { marginLeft: 6, fontSize: 13, color: '#666' },
  hostName: { fontSize: 14, color: '#999', marginBottom: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 12 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  metricDivider: { width: 1, backgroundColor: '#E0E0E0' },
  productionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productionText: { marginLeft: 8, fontSize: 13, color: '#555' },
  buyerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  buyerText: { marginLeft: 8, fontSize: 13, color: '#555' },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#E3F2FD', gap: 6 },
  detailsButtonText: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  emptyButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: '#4CAF50' },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
