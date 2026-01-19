/**
 * Host Dashboard - Solar Panel Space Management
 * Shows available panel slots, installed panels, rent earned, maintenance
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

interface InstalledPanel {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_contact: string;
  capacity_kw: number;
  installation_date: string;
  industry_name: string;
  monthly_production_kwh: number;
  monthly_rent: number;
  status: 'active' | 'maintenance' | 'inactive';
  next_maintenance: string;
}

interface HostSummary {
  total_panels_installed: number;
  available_panel_slots: number;
  total_capacity_kw: number;
  monthly_rent_earned: number;
  total_earned_lifetime: number;
  next_maintenance_date: string;
  property_rating: number;
}

export default function HostDashboard() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  
  const [summary, setSummary] = useState<HostSummary | null>(null);
  const [installedPanels, setInstalledPanels] = useState<InstalledPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get('/host/dashboard');
      setSummary(response.data.summary);
      setInstalledPanels(response.data.installed_panels);
    } catch (error) {
      console.error('Failed to load host dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleContactBuyer = (panel: InstalledPanel) => {
    Alert.alert(
      `Contact ${panel.buyer_name}`,
      `Phone: ${panel.buyer_contact}`,
      [
        { text: 'Call', onPress: () => console.log('Call buyer') },
        { text: 'Message', onPress: () => console.log('Message buyer') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your panel space...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Solar Panel Space</Text>
          <Text style={styles.headerSubtitle}>Hosting {summary?.total_panels_installed || 0} panels</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('HostSettings' as never)}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
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
            <View style={[styles.summaryCard, { flex: 1.5, backgroundColor: '#E8F5E9' }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="wallet" size={28} color="#4CAF50" />
                <View style={styles.earningBadge}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.summaryValue}>₹{safeToFixed(summary?.monthly_rent_earned || 0, 0)}</Text>
              <Text style={styles.summaryLabel}>Monthly Rent</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="sunny" size={24} color="#2196F3" />
              <Text style={styles.summaryValue}>{summary?.total_panels_installed || 0}</Text>
              <Text style={styles.summaryLabel}>Panels Installed</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#FF9800" />
              <Text style={styles.summaryValue}>{summary?.available_panel_slots || 0}</Text>
              <Text style={styles.summaryLabel}>Available Slots</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="flash" size={24} color="#9C27B0" />
              <Text style={styles.summaryValue}>{summary?.total_capacity_kw || 0} kW</Text>
              <Text style={styles.summaryLabel}>Total Capacity</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1, backgroundColor: '#FFE8E8' }]}>
              <Ionicons name="star" size={24} color="#FF6B6B" />
              <Text style={styles.summaryValue}>{safeToFixed(summary?.property_rating || 0, 1)}</Text>
              <Text style={styles.summaryLabel}>Property Rating</Text>
            </View>
          </View>

          {/* Lifetime Earnings */}
          <View style={styles.lifetimeCard}>
            <Ionicons name="trophy" size={28} color="#FFD700" />
            <View style={styles.lifetimeText}>
              <Text style={styles.lifetimeLabel}>Total Earned (Lifetime)</Text>
              <Text style={styles.lifetimeValue}>
                ₹{safeToFixed(summary?.total_earned_lifetime || 0, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Available Slots Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Panel Slots</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('UpdatePanelCapacity' as never)}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {summary && summary.available_panel_slots > 0 ? (
            <View style={styles.availableCard}>
              <View style={styles.availableHeader}>
                <Ionicons name="add-circle" size={32} color="#4CAF50" />
                <Text style={styles.availableCount}>
                  {summary.available_panel_slots} panel slots available
                </Text>
              </View>
              <Text style={styles.availableText}>
                You can host {summary.available_panel_slots} more solar panels on your property.
                Buyers will see your space and can invest.
              </Text>
              <TouchableOpacity
                style={styles.promoteButton}
                onPress={() =>
                  Alert.alert('Promote Space', 'Share your property on platform marketplace')
                }
              >
                <Ionicons name="megaphone" size={16} color="#FFF" />
                <Text style={styles.promoteButtonText}>Promote My Space</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fullCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.fullTitle}>All Slots Occupied</Text>
              <Text style={styles.fullText}>
                Your property is fully utilized. Great job! You can increase capacity anytime.
              </Text>
            </View>
          )}
        </View>

        {/* Installed Panels Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installed Panels ({installedPanels.length})</Text>

          {installedPanels.map((panel) => (
            <View key={panel.id} style={styles.panelCard}>
              {/* Panel Header */}
              <View style={styles.panelHeader}>
                <View style={styles.panelIconContainer}>
                  <Ionicons name="sunny" size={28} color="#FF9800" />
                  <Text style={styles.panelCapacity}>{panel.capacity_kw} kW</Text>
                </View>
                <View
                  style={[
                    styles.panelStatus,
                    {
                      backgroundColor:
                        panel.status === 'active'
                          ? '#4CAF50'
                          : panel.status === 'maintenance'
                          ? '#FF9800'
                          : '#999',
                    },
                  ]}
                >
                  <Text style={styles.panelStatusText}>
                    {panel.status === 'active'
                      ? 'Active'
                      : panel.status === 'maintenance'
                      ? 'Maintenance'
                      : 'Inactive'}
                  </Text>
                </View>
              </View>

              {/* Buyer Info */}
              <View style={styles.panelSection}>
                <Text style={styles.panelSectionTitle}>Panel Owner (Buyer)</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.infoText}>{panel.buyer_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#666" />
                  <Text style={styles.infoText}>{panel.buyer_contact}</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContactBuyer(panel)}
                >
                  <Ionicons name="chatbubble-outline" size={14} color="#007AFF" />
                  <Text style={styles.contactButtonText}>Contact Owner</Text>
                </TouchableOpacity>
              </View>

              {/* Production & Revenue */}
              <View style={styles.panelMetrics}>
                <View style={styles.panelMetric}>
                  <Ionicons name="flash" size={18} color="#FF9800" />
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{panel.monthly_production_kwh} kWh</Text>
                    <Text style={styles.metricLabel}>Monthly Production</Text>
                  </View>
                </View>
                <View style={styles.panelMetric}>
                  <Ionicons name="wallet" size={18} color="#4CAF50" />
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>₹{panel.monthly_rent}</Text>
                    <Text style={styles.metricLabel}>Your Monthly Rent</Text>
                  </View>
                </View>
              </View>

              {/* Industry Buyer */}
              <View style={styles.industryRow}>
                <Ionicons name="business" size={16} color="#2196F3" />
                <Text style={styles.industryText}>
                  Energy sold to: {panel.industry_name}
                </Text>
              </View>

              {/* Maintenance */}
              <View style={styles.maintenanceRow}>
                <Ionicons name="construct" size={16} color="#FF9800" />
                <Text style={styles.maintenanceText}>
                  Next maintenance: {new Date(panel.next_maintenance).toLocaleDateString()}
                </Text>
              </View>

              {/* Installation Date */}
              <Text style={styles.installDate}>
                Installed on: {new Date(panel.installation_date).toLocaleDateString()}
              </Text>
            </View>
          ))}

          {/* Empty State */}
          {installedPanels.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="sunny-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>No Panels Installed Yet</Text>
              <Text style={styles.emptyText}>
                Make your property available for solar panel installations to earn rent
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('RegisterPanelSpace' as never)}
              >
                <Text style={styles.emptyButtonText}>Register Your Space</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Maintenance Schedule */}
        {summary?.next_maintenance_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
            <View style={styles.maintenanceCard}>
              <Ionicons name="calendar" size={24} color="#FF9800" />
              <View style={styles.maintenanceInfo}>
                <Text style={styles.maintenanceDate}>
                  {new Date(summary.next_maintenance_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.maintenanceDesc}>
                  Scheduled cleaning & inspection for all panels
                </Text>
              </View>
            </View>
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
  settingsButton: { padding: 4 },
  scrollView: { flex: 1 },
  summarySection: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  earningBadge: { marginLeft: 4, backgroundColor: '#FFF', borderRadius: 8, padding: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 4 },
  summaryLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  lifetimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lifetimeText: { marginLeft: 12, flex: 1 },
  lifetimeLabel: { fontSize: 13, color: '#666' },
  lifetimeValue: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  editLink: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  availableCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50' },
  availableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  availableCount: { marginLeft: 12, fontSize: 18, fontWeight: '700', color: '#333' },
  availableText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  promoteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 10, gap: 8 },
  promoteButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  fullCard: { alignItems: 'center', backgroundColor: '#FFF', padding: 32, borderRadius: 12 },
  fullTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 12 },
  fullText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  panelCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  panelIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelCapacity: { fontSize: 16, fontWeight: '700', color: '#FF9800' },
  panelStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  panelStatusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  panelSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  panelSectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#333' },
  contactButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E3F2FD', gap: 6 },
  contactButtonText: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  panelMetrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  panelMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 10, gap: 8 },
  metricContent: { flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  metricLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  industryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  industryText: { marginLeft: 8, fontSize: 13, color: '#555' },
  maintenanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  maintenanceText: { marginLeft: 8, fontSize: 13, color: '#FF9800' },
  installDate: { fontSize: 11, color: '#999', textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  emptyButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: '#4CAF50' },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  maintenanceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF9800' },
  maintenanceInfo: { marginLeft: 12, flex: 1 },
  maintenanceDate: { fontSize: 16, fontWeight: '700', color: '#333' },
  maintenanceDesc: { fontSize: 13, color: '#666', marginTop: 4 },
});
