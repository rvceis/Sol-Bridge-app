/**
 * Solar Energy Sharing Platform - Find Energy Sources Screen
 * Buyers can discover and save energy sources (hosts) using smart matching
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { marketplaceApi } from '../../api/marketplaceService';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

interface EnergySource {
  host_id: string;
  host_name: string;
  listing_id: string;
  solar_capacity_kw: number;
  panel_brand: string;
  available_kwh: number;
  price_per_kwh: number;
  distance_km: number | null;
  city: string;
  state: string;
  rating: number;
  completed_transactions: number;
  renewable_certified: boolean;
  listing_type: string;
  match_score: number;
  match_breakdown: {
    price: number;
    rating: number;
    distance: number;
    renewable: number;
    reliability: number;
  };
}

export default function FindEnergySourcesScreen() {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [sources, setSources] = useState<EnergySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter preferences
  const [filters, setFilters] = useState({
    maxPrice: '15',
    maxDistance: '100',
    renewableOnly: false,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    header: {
      paddingHorizontal: responsive.screenPadding,
      paddingVertical: responsive.screenPadding * 1.5,
      paddingTop: responsive.screenPadding * 2,
    },
    headerTitle: {
      fontSize: 24 * responsive.fontScale,
      fontWeight: '700',
      color: '#FFF',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14 * responsive.fontScale,
      color: 'rgba(255,255,255,0.8)',
    },
    searchBar: {
      flexDirection: 'row',
      paddingHorizontal: responsive.screenPadding,
      paddingVertical: responsive.gridGap,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap,
      borderRadius: 12,
      gap: 8,
    },
    filterButtonText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    filterBadge: {
      backgroundColor: '#007AFF',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    resultCount: {
      flex: 1,
      justifyContent: 'center',
    },
    resultCountText: {
      fontSize: 14 * responsive.fontScale,
      color: '#666',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.screenPadding * 2,
    },
    emptyTitle: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginTop: responsive.screenPadding,
      marginBottom: responsive.gridGap,
    },
    emptyText: {
      fontSize: 14 * responsive.fontScale,
      color: '#999',
      textAlign: 'center',
    },
    listContent: {
      padding: responsive.screenPadding,
    },
    sourceCard: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: responsive.cardPadding,
      marginBottom: responsive.screenPadding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: responsive.cardPadding,
    },
    hostInfo: {
      flex: 1,
    },
    hostName: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    hostLocation: {
      fontSize: 13 * responsive.fontScale,
      color: '#666',
    },
    matchScoreBadge: {
      alignItems: 'center',
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap,
      borderRadius: 12,
    },
    matchScoreValue: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '700',
      color: '#FFF',
    },
    matchScoreLabel: {
      fontSize: 10 * responsive.fontScale,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: responsive.cardPadding,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    badgeText: {
      fontSize: 12 * responsive.fontScale,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: responsive.cardPadding,
      marginBottom: responsive.cardPadding,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    statLabel: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: responsive.gridGap,
    },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#007AFF',
      paddingVertical: responsive.cardPadding,
      borderRadius: 12,
      gap: 8,
    },
    saveButtonSaved: {
      backgroundColor: '#E8F5E9',
    },
    saveButtonText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#FFF',
    },
    saveButtonTextSaved: {
      color: '#4CAF50',
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.cardPadding,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DDD',
      gap: 6,
    },
    viewButtonText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#666',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: responsive.screenPadding,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.screenPadding,
    },
    modalTitle: {
      fontSize: 20 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    filterSection: {
      marginBottom: responsive.screenPadding,
    },
    filterLabel: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginBottom: responsive.gridGap,
    },
    filterInput: {
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 12,
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.cardPadding,
      fontSize: 16 * responsive.fontScale,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.gridGap,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: responsive.gridGap,
    },
    checkboxLabel: {
      fontSize: 14 * responsive.fontScale,
      color: '#333',
      marginLeft: responsive.gridGap,
    },
    applyButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: responsive.cardPadding * 1.2,
      alignItems: 'center',
      marginTop: responsive.screenPadding,
    },
    applyButtonText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#FFF',
    },
  });

  const loadSources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await marketplaceApi.findEnergySources({
        maxPrice: parseFloat(filters.maxPrice) || 15,
        maxDistance: parseFloat(filters.maxDistance) || 100,
        renewableOnly: filters.renewableOnly,
        limit: 30,
      });
      setSources(response.data || []);
    } catch (error: any) {
      console.error('Error loading sources:', error);
      Alert.alert('Error', 'Failed to load energy sources');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSources();
  };

  const handleSaveSource = async (source: EnergySource) => {
    try {
      setSavingId(source.host_id);
      await marketplaceApi.saveEnergySource({
        hostId: source.host_id,
        sourceName: `${source.host_name}'s Solar`,
        matchScore: source.match_score,
        pricePerKwh: source.price_per_kwh,
        distanceKm: source.distance_km || undefined,
        renewableCertified: source.renewable_certified,
        subscriptionType: 'on-demand',
      });
      Alert.alert('Success', 'Energy source saved to your list!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save energy source');
    } finally {
      setSavingId(null);
    }
  };

  const getMatchScoreColor = (score: number): [string, string] => {
    if (score >= 80) return ['#4CAF50', '#81C784'];
    if (score >= 60) return ['#FF9800', '#FFB74D'];
    return ['#F44336', '#E57373'];
  };

  const renderSourceCard = ({ item }: { item: EnergySource }) => {
    const scoreColors = getMatchScoreColor(item.match_score);

    return (
      <View style={styles.sourceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{item.host_name}</Text>
            <Text style={styles.hostLocation}>
              {item.city ? `${item.city}, ${item.state || ''}` : 'Location not specified'}
              {item.distance_km ? ` • ${safeToFixed(item.distance_km, 1)} km away` : ''}
            </Text>
          </View>
          <LinearGradient
            colors={scoreColors}
            style={styles.matchScoreBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.matchScoreValue}>{item.match_score}%</Text>
            <Text style={styles.matchScoreLabel}>Match</Text>
          </LinearGradient>
        </View>

        <View style={styles.badgeRow}>
          {item.renewable_certified && (
            <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf" size={14} color="#4CAF50" />
              <Text style={[styles.badgeText, { color: '#4CAF50' }]}>Certified Green</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="star" size={14} color="#2196F3" />
            <Text style={[styles.badgeText, { color: '#2196F3' }]}>
              {safeToFixed(item.rating, 1)} ({item.completed_transactions} sales)
            </Text>
          </View>
          {item.solar_capacity_kw > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="sunny" size={14} color="#FF9800" />
              <Text style={[styles.badgeText, { color: '#FF9800' }]}>
                {item.solar_capacity_kw} kW
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{safeToFixed(item.price_per_kwh, 2)}</Text>
            <Text style={styles.statLabel}>per kWh</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{safeToFixed(item.available_kwh, 1)}</Text>
            <Text style={styles.statLabel}>kWh Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.listing_type}</Text>
            <Text style={styles.statLabel}>Type</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.saveButton]}
            onPress={() => handleSaveSource(item)}
            disabled={savingId === item.host_id}
          >
            {savingId === item.host_id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="bookmark-outline" size={18} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Source</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => (navigation as any).navigate('MarketplaceMain', { sellerId: item.host_id })}
          >
            <Ionicons name="cart-outline" size={18} color="#666" />
            <Text style={styles.viewButtonText}>Buy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const hasActiveFilters = filters.renewableOnly || 
    filters.maxPrice !== '15' || 
    filters.maxDistance !== '100';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Find Energy Sources</Text>
        <Text style={styles.headerSubtitle}>
          Connect with solar hosts near you
        </Text>
      </LinearGradient>

      {/* Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>
            {sources.length} sources found
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color="#333" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : sources.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sunny-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Sources Found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your filters or check back later for new hosts
          </Text>
        </View>
      ) : (
        <FlatList
          data={sources}
          renderItem={renderSourceCard}
          keyExtractor={(item) => item.host_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Sources</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Price (₹/kWh)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="15"
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(val) => setFilters({ ...filters, maxPrice: val })}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Distance (km)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="100"
                  keyboardType="numeric"
                  value={filters.maxDistance}
                  onChangeText={(val) => setFilters({ ...filters, maxDistance: val })}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFilters({ ...filters, renewableOnly: !filters.renewableOnly })
                }
              >
                <Ionicons
                  name={filters.renewableOnly ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={filters.renewableOnly ? '#4CAF50' : '#999'}
                />
                <Text style={styles.checkboxLabel}>Only Certified Renewable Sources</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setShowFilters(false);
                  loadSources();
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
