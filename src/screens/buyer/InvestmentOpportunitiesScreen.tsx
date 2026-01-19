/**
 * Investment Opportunities Screen - Browse Available Host Locations
 * Shows AI-recommended matches, filters, map view
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
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import apiClient from '../../api/client';
import { safeToFixed } from '../../utils/formatters';

interface Opportunity {
  id: string;
  host_id: string;
  host_name: string;
  host_rating: number;
  location: string;
  latitude: number;
  longitude: number;
  available_capacity_kw: number;
  panel_price: number;
  estimated_monthly_profit: number;
  estimated_roi_percentage: number;
  payback_period_months: number;
  nearby_industries: number;
  distance_km: number;
  risk_score: number;
  ai_match_score: number;
  property_images: string[];
  is_ai_recommended: boolean;
}

export default function InvestmentOpportunitiesScreen() {
  const navigation = useNavigation();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minBudget: '',
    maxBudget: '',
    minROI: '',
    maxDistance: '',
    sortBy: 'ai_match' as 'ai_match' | 'roi' | 'distance' | 'price',
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, opportunities]);

  const loadOpportunities = async () => {
    try {
      const response = await apiClient.get('/investments/opportunities');
      setOpportunities(response.data.opportunities);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      Alert.alert('Error', 'Failed to load investment opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((opp) =>
        opp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.host_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Budget filter
    if (filters.minBudget) {
      filtered = filtered.filter((opp) => opp.panel_price >= parseFloat(filters.minBudget));
    }
    if (filters.maxBudget) {
      filtered = filtered.filter((opp) => opp.panel_price <= parseFloat(filters.maxBudget));
    }

    // ROI filter
    if (filters.minROI) {
      filtered = filtered.filter((opp) => opp.estimated_roi_percentage >= parseFloat(filters.minROI));
    }

    // Distance filter
    if (filters.maxDistance) {
      filtered = filtered.filter((opp) => opp.distance_km <= parseFloat(filters.maxDistance));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'ai_match':
          return b.ai_match_score - a.ai_match_score;
        case 'roi':
          return b.estimated_roi_percentage - a.estimated_roi_percentage;
        case 'distance':
          return a.distance_km - b.distance_km;
        case 'price':
          return a.panel_price - b.panel_price;
        default:
          return 0;
      }
    });

    setFilteredOpportunities(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOpportunities();
  };

  const handleInvest = (opportunity: Opportunity) => {
    navigation.navigate('InvestmentDetail' as never, { opportunityId: opportunity.id } as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding best opportunities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Investment Opportunities</Text>
          <Text style={styles.headerSubtitle}>{filteredOpportunities.length} locations available</Text>
        </View>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
          <Ionicons name={viewMode === 'list' ? 'map' : 'list'} size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or host name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, filters.sortBy === 'ai_match' && styles.sortButtonActive]}
            onPress={() => setFilters({ ...filters, sortBy: 'ai_match' })}
          >
            <Ionicons name="star" size={16} color={filters.sortBy === 'ai_match' ? '#FFF' : '#666'} />
            <Text style={[styles.sortText, filters.sortBy === 'ai_match' && styles.sortTextActive]}>
              AI Match
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, filters.sortBy === 'roi' && styles.sortButtonActive]}
            onPress={() => setFilters({ ...filters, sortBy: 'roi' })}
          >
            <Ionicons name="trending-up" size={16} color={filters.sortBy === 'roi' ? '#FFF' : '#666'} />
            <Text style={[styles.sortText, filters.sortBy === 'roi' && styles.sortTextActive]}>Best ROI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, filters.sortBy === 'distance' && styles.sortButtonActive]}
            onPress={() => setFilters({ ...filters, sortBy: 'distance' })}
          >
            <Ionicons name="location" size={16} color={filters.sortBy === 'distance' ? '#FFF' : '#666'} />
            <Text style={[styles.sortText, filters.sortBy === 'distance' && styles.sortTextActive]}>
              Nearest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, filters.sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setFilters({ ...filters, sortBy: 'price' })}
          >
            <Ionicons name="pricetag" size={16} color={filters.sortBy === 'price' ? '#FFF' : '#666'} />
            <Text style={[styles.sortText, filters.sortBy === 'price' && styles.sortTextActive]}>
              Price
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map View */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: filteredOpportunities[0]?.latitude || 28.6139,
              longitude: filteredOpportunities[0]?.longitude || 77.209,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
          >
            {filteredOpportunities.map((opp) => (
              <Marker
                key={opp.id}
                coordinate={{ latitude: opp.latitude, longitude: opp.longitude }}
                onPress={() => handleInvest(opp)}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: opp.is_ai_recommended ? '#4CAF50' : '#2196F3' },
                    ]}
                  >
                    <Ionicons name="sunny" size={16} color="#FFF" />
                  </View>
                  <Text style={styles.markerText}>₹{safeToFixed(opp.panel_price / 100000, 1)}L</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      ) : (
        // List View
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Recommended Section */}
          {filteredOpportunities.some((opp) => opp.is_ai_recommended) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>AI Recommended For You</Text>
              </View>

              {filteredOpportunities
                .filter((opp) => opp.is_ai_recommended)
                .map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onPress={() => handleInvest(opp)} />
                ))}
            </View>
          )}

          {/* All Opportunities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Opportunities</Text>

            {filteredOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} onPress={() => handleInvest(opp)} />
            ))}

            {filteredOpportunities.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No Opportunities Found</Text>
                <Text style={styles.emptyText}>Try adjusting your filters or search criteria</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity, onPress }: { opportunity: Opportunity; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* AI Badge */}
      {opportunity.is_ai_recommended && (
        <View style={styles.aiBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.aiBadgeText}>AI Match {opportunity.ai_match_score}%</Text>
        </View>
      )}

      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.hostInfo}>
          <Text style={styles.hostName}>{opportunity.host_name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{safeToFixed(opportunity.host_rating, 1)}</Text>
            <Ionicons name="location" size={14} color="#999" style={{ marginLeft: 8 }} />
            <Text style={styles.distance}>{opportunity.distance_km} km away</Text>
          </View>
        </View>
        <View style={styles.capacityBadge}>
          <Ionicons name="sunny" size={16} color="#FF9800" />
          <Text style={styles.capacityText}>{opportunity.available_capacity_kw} kW</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.locationText}>{opportunity.location}</Text>
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Investment</Text>
          <Text style={styles.metricValue}>₹{safeToFixed(opportunity.panel_price / 100000, 1)}L</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Monthly Profit</Text>
          <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
            ₹{safeToFixed(opportunity.estimated_monthly_profit / 1000, 1)}K
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ROI</Text>
          <Text style={[styles.metricValue, { color: '#2196F3' }]}>
            {safeToFixed(opportunity.estimated_roi_percentage, 1)}%
          </Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="business" size={14} color="#666" />
          <Text style={styles.infoText}>{opportunity.nearby_industries} nearby industries</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.infoText}>Payback: {opportunity.payback_period_months} months</Text>
        </View>
      </View>

      {/* Risk Score */}
      <View style={styles.riskRow}>
        <Text style={styles.riskLabel}>Risk Score:</Text>
        <View style={styles.riskBar}>
          <View
            style={[
              styles.riskFill,
              {
                width: `${opportunity.risk_score}%`,
                backgroundColor:
                  opportunity.risk_score < 30 ? '#4CAF50' : opportunity.risk_score < 60 ? '#FF9800' : '#F44336',
              },
            ]}
          />
        </View>
        <Text style={styles.riskValue}>{opportunity.risk_score}/100</Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={styles.investButton} onPress={onPress}>
        <Text style={styles.investButtonText}>View Details & Invest</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { marginRight: 12 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  searchSection: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  sortContainer: { flexDirection: 'row' },
  sortButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, gap: 6 },
  sortButtonActive: { backgroundColor: '#007AFF' },
  sortText: { fontSize: 13, fontWeight: '600', color: '#666' },
  sortTextActive: { color: '#FFF' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center' },
  marker: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  markerText: { fontSize: 10, fontWeight: '700', color: '#333', marginTop: 2, backgroundColor: '#FFF', paddingHorizontal: 4, borderRadius: 4 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginLeft: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  aiBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4, zIndex: 1 },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  hostInfo: { flex: 1 },
  hostName: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 13, color: '#666', marginLeft: 4 },
  distance: { fontSize: 13, color: '#666', marginLeft: 4 },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  capacityText: { fontSize: 14, fontWeight: '700', color: '#FF9800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { marginLeft: 6, fontSize: 14, color: '#666' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoText: { marginLeft: 6, fontSize: 12, color: '#666' },
  riskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  riskLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  riskBar: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  riskFill: { height: '100%' },
  riskValue: { fontSize: 12, fontWeight: '600', color: '#666', marginLeft: 8 },
  investButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 12, gap: 8 },
  investButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
});
