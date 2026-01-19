/**
 * Industry Dashboard - Energy Procurement & Consumption Tracking
 * Shows energy consumption, suppliers, cost savings, carbon credits
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
import { LineChart } from 'react-native-chart-kit';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

interface Supplier {
  id: string;
  buyer_name: string;
  host_name: string;
  host_location: string;
  panel_capacity_kw: number;
  monthly_supply_kwh: number;
  contract_price_per_kwh: number;
  contract_start_date: string;
  contract_end_date: string;
  status: 'active' | 'expiring' | 'inactive';
}

interface IndustrySummary {
  total_consumption_kwh: number;
  total_cost: number;
  grid_comparison_savings: number;
  active_suppliers: number;
  carbon_credits_kg: number;
  avg_price_per_kwh: number;
}

interface ConsumptionData {
  labels: string[];
  datasets: { data: number[] }[];
}

export default function IndustryDashboard() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [summary, setSummary] = useState<IndustrySummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [consumptionData, setConsumptionData] = useState<ConsumptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadDashboard();
  }, [selectedPeriod]);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get(`/industry/dashboard?period=${selectedPeriod}`);
      setSummary(response.data.summary);
      setSuppliers(response.data.suppliers);
      setConsumptionData(response.data.consumption_data);
    } catch (error) {
      console.error('Failed to load industry dashboard:', error);
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
        <Text style={styles.loadingText}>Loading energy dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Energy Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {summary?.total_consumption_kwh || 0} kWh consumed this month
          </Text>
        </View>
        <TouchableOpacity
          style={styles.certificateButton}
          onPress={() => navigation.navigate('DownloadCertificate' as never)}
        >
          <Ionicons name="document-text" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="flash" size={24} color="#2196F3" />
              <Text style={styles.summaryValue}>
                {safeToFixed(summary?.total_consumption_kwh || 0, 0)}
              </Text>
              <Text style={styles.summaryLabel}>kWh Consumed</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="trending-down" size={24} color="#4CAF50" />
              <Text style={styles.summaryValue}>
                ₹{safeToFixed(summary?.grid_comparison_savings || 0, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Saved vs Grid</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={24} color="#FF9800" />
              <Text style={styles.summaryValue}>{summary?.active_suppliers || 0}</Text>
              <Text style={styles.summaryLabel}>Active Suppliers</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="leaf" size={24} color="#4CAF50" />
              <Text style={styles.summaryValue}>
                {safeToFixed((summary?.carbon_credits_kg || 0) / 1000, 1)}
              </Text>
              <Text style={styles.summaryLabel}>Tons CO₂ Saved</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#FFE8E8' }]}>
              <Ionicons name="pricetag" size={24} color="#FF6B6B" />
              <Text style={styles.summaryValue}>
                ₹{safeToFixed(summary?.avg_price_per_kwh || 0, 2)}
              </Text>
              <Text style={styles.summaryLabel}>Avg ₹/kWh</Text>
            </View>
          </View>

          {/* Total Cost Card */}
          <View style={styles.costCard}>
            <View style={styles.costHeader}>
              <Ionicons name="wallet" size={28} color="#2196F3" />
              <View style={styles.costText}>
                <Text style={styles.costLabel}>Total Monthly Cost</Text>
                <Text style={styles.costValue}>
                  ₹{safeToFixed(summary?.total_cost || 0, 0)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewBillButton}
              onPress={() => navigation.navigate('BillingHistory' as never)}
            >
              <Text style={styles.viewBillText}>View Billing History</Text>
              <Ionicons name="arrow-forward" size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Consumption Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Energy Consumption</Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'week' && styles.periodButtonTextActive,
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'month' && styles.periodButtonTextActive,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {consumptionData ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={consumptionData}
                width={Dimensions.get('window').width - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFF',
                  backgroundGradientFrom: '#FFF',
                  backgroundGradientTo: '#FFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2', stroke: '#2196F3' },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.noChartData}>
              <Text style={styles.noChartText}>No consumption data available</Text>
            </View>
          )}
        </View>

        {/* Active Suppliers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solar Suppliers ({suppliers.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FindSuppliers' as never)}>
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {suppliers.map((supplier) => (
            <View key={supplier.id} style={styles.supplierCard}>
              {/* Supplier Header */}
              <View style={styles.supplierHeader}>
                <View style={styles.supplierIconContainer}>
                  <Ionicons name="sunny" size={28} color="#FF9800" />
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierName}>{supplier.buyer_name}</Text>
                    <Text style={styles.supplierCapacity}>{supplier.panel_capacity_kw} kW Panel</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.supplierStatus,
                    {
                      backgroundColor:
                        supplier.status === 'active'
                          ? '#4CAF50'
                          : supplier.status === 'expiring'
                          ? '#FF9800'
                          : '#999',
                    },
                  ]}
                >
                  <Text style={styles.supplierStatusText}>
                    {supplier.status === 'active'
                      ? 'Active'
                      : supplier.status === 'expiring'
                      ? 'Expiring'
                      : 'Inactive'}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.supplierRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.supplierText}>
                  Hosted at: {supplier.host_name} ({supplier.host_location})
                </Text>
              </View>

              {/* Supply Metrics */}
              <View style={styles.supplierMetrics}>
                <View style={styles.supplierMetric}>
                  <Ionicons name="flash" size={18} color="#FF9800" />
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{supplier.monthly_supply_kwh} kWh</Text>
                    <Text style={styles.metricLabel}>Monthly Supply</Text>
                  </View>
                </View>
                <View style={styles.supplierMetric}>
                  <Ionicons name="pricetag" size={18} color="#2196F3" />
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>
                      ₹{safeToFixed(supplier.contract_price_per_kwh, 2)}/kWh
                    </Text>
                    <Text style={styles.metricLabel}>Contract Price</Text>
                  </View>
                </View>
              </View>

              {/* Contract Period */}
              <View style={styles.contractRow}>
                <Ionicons name="calendar" size={16} color="#999" />
                <Text style={styles.contractText}>
                  Contract: {new Date(supplier.contract_start_date).toLocaleDateString()} -{' '}
                  {new Date(supplier.contract_end_date).toLocaleDateString()}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.supplierActions}>
                <TouchableOpacity
                  style={styles.supplierActionButton}
                  onPress={() =>
                    navigation.navigate('ContractDetails' as never, { supplierId: supplier.id } as never)
                  }
                >
                  <Text style={styles.actionButtonText}>View Contract</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.supplierActionButton, { backgroundColor: '#E3F2FD' }]}
                  onPress={() => console.log('Contact supplier')}
                >
                  <Ionicons name="chatbubble-outline" size={14} color="#2196F3" />
                  <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Empty State */}
          {suppliers.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>No Suppliers Yet</Text>
              <Text style={styles.emptyText}>
                Browse available solar panel suppliers and lock in competitive pricing
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('FindSuppliers' as never)}
              >
                <Text style={styles.emptyButtonText}>Find Suppliers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Carbon Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          <View style={styles.carbonCard}>
            <View style={styles.carbonHeader}>
              <Ionicons name="leaf" size={48} color="#4CAF50" />
              <View style={styles.carbonText}>
                <Text style={styles.carbonValue}>
                  {safeToFixed((summary?.carbon_credits_kg || 0) / 1000, 2)} Tons
                </Text>
                <Text style={styles.carbonLabel}>CO₂ Emissions Saved</Text>
              </View>
            </View>
            <Text style={styles.carbonDesc}>
              By using solar energy, you've prevented{' '}
              {safeToFixed((summary?.carbon_credits_kg || 0) / 1000, 2)} tons of CO₂ from entering the
              atmosphere. That's equivalent to planting{' '}
              {Math.floor((summary?.carbon_credits_kg || 0) / 20)} trees! 🌳
            </Text>
            <TouchableOpacity
              style={styles.downloadCertificateButton}
              onPress={() => navigation.navigate('DownloadCertificate' as never)}
            >
              <Ionicons name="download" size={16} color="#FFF" />
              <Text style={styles.downloadCertificateText}>Download Certificate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Comparison</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Ionicons name="sunny" size={24} color="#FF9800" />
                <Text style={styles.comparisonLabel}>Solar Energy</Text>
                <Text style={styles.comparisonValue}>
                  ₹{safeToFixed(summary?.avg_price_per_kwh || 0, 2)}/kWh
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#999" />
              <View style={styles.comparisonItem}>
                <Ionicons name="business" size={24} color="#999" />
                <Text style={styles.comparisonLabel}>Grid Energy</Text>
                <Text style={[styles.comparisonValue, { color: '#F44336' }]}>
                  ₹{safeToFixed((summary?.avg_price_per_kwh || 0) + 2.5, 2)}/kWh
                </Text>
              </View>
            </View>
            <View style={styles.savingsRow}>
              <Ionicons name="trending-down" size={20} color="#4CAF50" />
              <Text style={styles.savingsText}>
                You're saving ₹{safeToFixed(summary?.grid_comparison_savings || 0, 0)} per month!
              </Text>
            </View>
          </View>
        </View>

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
  certificateButton: { padding: 4 },
  scrollView: { flex: 1 },
  summarySection: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 4 },
  summaryLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  costCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  costHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  costText: { marginLeft: 12, flex: 1 },
  costLabel: { fontSize: 13, color: '#666' },
  costValue: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 4 },
  viewBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    gap: 8,
  },
  viewBillText: { fontSize: 15, fontWeight: '600', color: '#2196F3' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  addLink: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  periodToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 2 },
  periodButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  periodButtonActive: { backgroundColor: '#2196F3' },
  periodButtonText: { fontSize: 13, fontWeight: '600', color: '#666' },
  periodButtonTextActive: { color: '#FFF' },
  chartContainer: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  chart: { borderRadius: 12 },
  noChartData: { backgroundColor: '#FFF', padding: 40, borderRadius: 12, alignItems: 'center' },
  noChartText: { fontSize: 14, color: '#999' },
  supplierCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 16, fontWeight: '700', color: '#333' },
  supplierCapacity: { fontSize: 13, color: '#FF9800', marginTop: 2 },
  supplierStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  supplierStatusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  supplierRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  supplierText: { marginLeft: 8, fontSize: 13, color: '#666', flex: 1 },
  supplierMetrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  supplierMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  metricContent: { flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  metricLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  contractRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contractText: { marginLeft: 8, fontSize: 12, color: '#999' },
  supplierActions: { flexDirection: 'row', gap: 8 },
  supplierActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
  },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  carbonCard: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  carbonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  carbonText: { marginLeft: 16, flex: 1 },
  carbonValue: { fontSize: 28, fontWeight: '700', color: '#4CAF50' },
  carbonLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  carbonDesc: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 16 },
  downloadCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  downloadCertificateText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  comparisonCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonItem: { alignItems: 'center', flex: 1 },
  comparisonLabel: { fontSize: 12, color: '#999', marginTop: 8 },
  comparisonValue: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  savingsText: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
});
