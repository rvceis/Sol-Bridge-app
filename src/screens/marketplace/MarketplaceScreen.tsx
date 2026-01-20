import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { marketplaceApi } from '../../api/marketplaceService';
import { useResponsive } from '../../hooks/useResponsive';
import { safeToFixed } from '../../utils/formatters';

interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  device_id: string;
  device_name: string;
  energy_amount_kwh: number;
  price_per_kwh: number;
  available_from: string;
  available_to: string;
  listing_type: string;
  status: string;
  renewable_cert: boolean;
  location_lat?: number;
  location_lon?: number;
  distance_km?: number;
}

export default function MarketplaceScreen() {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'nearby'>('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minEnergy: '',
    maxEnergy: '',
    listingType: 'all',
    renewableOnly: false,
    radius: '50', // Default 50km radius for nearby
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.screenPadding,
      paddingVertical: responsive.screenPadding,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    headerTitle: {
      fontSize: 22 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    createButton: {
      padding: responsive.cardPadding / 3,
    },
    searchBar: {
      flexDirection: 'row',
      padding: responsive.screenPadding,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      paddingHorizontal: responsive.cardPadding,
      marginRight: responsive.gridGap,
    },
    input: {
      flex: 1,
      paddingVertical: responsive.cardPadding,
      paddingHorizontal: responsive.gridGap,
      fontSize: 14 * responsive.fontScale,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF6B6B',
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
      padding: responsive.screenPadding * 2.5,
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
    listingCard: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: responsive.cardPadding,
      marginBottom: responsive.screenPadding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.cardPadding,
    },
    sellerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sellerDetails: {
      marginLeft: responsive.cardPadding,
    },
    sellerName: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    deviceName: {
      fontSize: 12 * responsive.fontScale,
      color: '#999',
      marginTop: 2,
    },
    certBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#E8F5E9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.cardPadding,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#F0F0F0',
    },
    energyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    energyAmount: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginLeft: responsive.gridGap,
    },
    priceInfo: {
      alignItems: 'flex-end',
    },
    priceLabel: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginBottom: 2,
    },
    priceAmount: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '700',
      color: '#4CAF50',
    },
    totalPrice: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
      marginTop: 2,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: responsive.cardPadding,
    },
    typeChip: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap / 1.5,
      borderRadius: 12,
    },
    typeText: {
      fontSize: 11 * responsive.fontScale,
      fontWeight: '600',
      color: '#2196F3',
      textTransform: 'capitalize',
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap / 1.5,
      borderRadius: 12,
      backgroundColor: '#E8F0FE',
    },
    chatButtonText: {
      fontSize: 12 * responsive.fontScale,
      fontWeight: '600',
      color: '#007AFF',
    },
    availabilityText: {
      fontSize: 11 * responsive.fontScale,
      color: '#999',
    },
     chatButton: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 6,
       paddingHorizontal: 12,
       paddingVertical: 8,
       backgroundColor: '#E3F2FD',
       borderRadius: 12,
     },
     chatButtonText: {
       fontSize: 12 * responsive.fontScale,
       fontWeight: '600',
       color: '#007AFF',
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
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: responsive.screenPadding,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    modalTitle: {
      fontSize: 20 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    filterScroll: {
      padding: responsive.screenPadding,
    },
    filterLabel: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginBottom: responsive.cardPadding,
      marginTop: responsive.gridGap,
    },
    rangeInputs: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.screenPadding,
    },
    rangeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 8,
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap,
      fontSize: 14 * responsive.fontScale,
    },
    rangeSeparator: {
      marginHorizontal: responsive.cardPadding,
      fontSize: 16 * responsive.fontScale,
      color: '#999',
    },
    typeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.gridGap,
      marginBottom: responsive.screenPadding,
    },
    typeButton: {
      paddingHorizontal: responsive.cardPadding,
      paddingVertical: responsive.gridGap,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#DDD',
      backgroundColor: '#FFF',
    },
    typeButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    typeButtonText: {
      fontSize: 13 * responsive.fontScale,
      fontWeight: '600',
      color: '#666',
    },
    typeButtonTextActive: {
      color: '#FFF',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: responsive.gridGap,
    },
    checkboxLabel: {
      fontSize: 14 * responsive.fontScale,
      color: '#333',
      marginLeft: responsive.cardPadding,
    },
    helperText: {
      fontSize: 12 * responsive.fontScale,
      color: '#999',
      marginTop: responsive.gridGap,
      marginBottom: responsive.cardPadding,
    },
    viewModeContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFF',
      paddingHorizontal: responsive.screenPadding,
      paddingBottom: responsive.gridGap * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    viewModeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.cardPadding,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    viewModeTabActive: {
      borderBottomColor: '#007AFF',
    },
    viewModeText: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#999',
      marginLeft: responsive.gridGap,
    },
    viewModeTextActive: {
      color: '#007AFF',
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFEBEE',
      paddingHorizontal: responsive.gridGap,
      paddingVertical: responsive.gridGap / 2.5,
      borderRadius: 12,
      gap: responsive.gridGap / 2,
    },
    distanceText: {
      fontSize: 11 * responsive.fontScale,
      fontWeight: '600',
      color: '#FF6B6B',
    },
    modalActions: {
      flexDirection: 'row',
      padding: responsive.screenPadding,
      borderTopWidth: 1,
      borderTopColor: '#EEE',
      gap: responsive.cardPadding,
    },
    resetButton: {
      flex: 1,
      paddingVertical: responsive.cardPadding * 1.4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DDD',
      alignItems: 'center',
    },
    resetButtonText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#666',
    },
    applyButton: {
      flex: 1,
      paddingVertical: responsive.cardPadding * 1.4,
      borderRadius: 12,
      backgroundColor: '#007AFF',
      alignItems: 'center',
    },
    applyButtonText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#FFF',
    },
});

  useEffect(() => {
    requestLocationPermission();
    loadListings();
  }, []);

  useEffect(() => {
    if (viewMode === 'nearby' && userLocation) {
      loadNearbyListings();
    }
  }, [viewMode]);

  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, filters]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show nearby listings. You can still browse all listings.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadListings = async () => {
    try {
      const response = await marketplaceApi.getListings({
        status: 'active',
      });
      setListings(response.data || []);
      setViewMode('all');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNearbyListings = async () => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location to see nearby listings');
      setViewMode('all');
      return;
    }

    setLoading(true);
    try {
      const response = await marketplaceApi.getNearbyListings(
        userLocation.latitude,
        userLocation.longitude,
        {
          radius: parseInt(filters.radius) || 50,
        }
      );
      setListings(response.data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load nearby listings');
      setViewMode('all');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'nearby') {
      loadNearbyListings();
    } else {
      loadListings();
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.device_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter((l) => l.price_per_kwh >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((l) => l.price_per_kwh <= parseFloat(filters.maxPrice));
    }

    // Energy filter
    if (filters.minEnergy) {
      filtered = filtered.filter((l) => l.energy_amount_kwh >= parseFloat(filters.minEnergy));
    }
    if (filters.maxEnergy) {
      filtered = filtered.filter((l) => l.energy_amount_kwh <= parseFloat(filters.maxEnergy));
    }

    // Type filter
    if (filters.listingType !== 'all') {
      filtered = filtered.filter((l) => l.listing_type === filters.listingType);
    }

    // Renewable filter
    if (filters.renewableOnly) {
      filtered = filtered.filter((l) => l.renewable_cert);
    }

    setFilteredListings(filtered);
  };

  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minEnergy: '',
      maxEnergy: '',
      listingType: 'all',
      renewableOnly: false,
      radius: '50',
    });
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const energyAmount = Number(item.energy_amount_kwh) || 0;
    const pricePerKwh = Number(item.price_per_kwh) || 0;
    const totalPrice = energyAmount * pricePerKwh;

     const handleContactSeller = () => {
       Alert.alert(
         'Contact Seller',
         `Start chat with ${item.seller_name}?`,
         [
           { text: 'Cancel', style: 'cancel' },
           {
             text: 'Chat',
             onPress: () => {
               // Navigate to Chat inside Discover tab
               (navigation as any).navigate('Discover', {
                 screen: 'Chat',
                 params: {
                   userId: item.seller_id,
                   name: item.seller_name,
                   listingId: item.id,
                 },
               });
             },
           },
         ]
       );
     };

    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => navigation.navigate('ListingDetail' as never, { listingId: item.id } as never)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sellerInfo}>
            <Ionicons name="person-circle" size={32} color="#007AFF" />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{item.seller_name || 'Unknown Seller'}</Text>
              <Text style={styles.deviceName}>{item.device_name || 'Solar Device'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.renewable_cert && (
              <View style={styles.certBadge}>
                <Ionicons name="leaf" size={16} color="#4CAF50" />
              </View>
            )}
            {item.distance_km !== undefined && item.distance_km !== null && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location" size={12} color="#FF6B6B" />
                <Text style={styles.distanceText}>{safeToFixed(Number(item.distance_km), 1)} km</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.energyInfo}>
            <Ionicons name="flash" size={20} color="#FF9800" />
            <Text style={styles.energyAmount}>{safeToFixed(energyAmount, 2)} kWh</Text>
          </View>

          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceAmount}>₹{safeToFixed(pricePerKwh, 2)}/kWh</Text>
            <Text style={styles.totalPrice}>Total: ₹{safeToFixed(totalPrice, 2)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{(item.listing_type || 'spot').replace('_', ' ')}</Text>
          </View>
           <TouchableOpacity 
             style={styles.chatButton}
             onPress={handleContactSeller}
           >
             <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
             <Text style={styles.chatButtonText}>Chat</Text>
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Energy Marketplace</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('FindEnergySources' as never)}
          >
            <Ionicons name="search" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateListing' as never)}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.input}
            placeholder="Search by seller or device..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#007AFF" />
          {(filters.minPrice || filters.maxPrice || filters.minEnergy || filters.maxEnergy || 
            filters.listingType !== 'all' || filters.renewableOnly) && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'all' && styles.viewModeTabActive]}
          onPress={() => {
            setViewMode('all');
            loadListings();
          }}
        >
          <Ionicons 
            name="globe-outline" 
            size={20} 
            color={viewMode === 'all' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.viewModeText, viewMode === 'all' && styles.viewModeTextActive]}>
            All Listings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'nearby' && styles.viewModeTabActive]}
          onPress={() => {
            if (locationPermission && userLocation) {
              setViewMode('nearby');
              loadNearbyListings();
            } else {
              Alert.alert(
                'Location Required',
                'Please enable location permissions to see nearby listings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Enable', onPress: requestLocationPermission },
                ]
              );
            }
          }}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={viewMode === 'nearby' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.viewModeText, viewMode === 'nearby' && styles.viewModeTextActive]}>
            Nearby
          </Text>
          {!locationPermission && (
            <Ionicons name="lock-closed" size={14} color="#FF6B6B" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Listings Found</Text>
          <Text style={styles.emptyText}>
            {listings.length === 0
              ? 'Be the first to list your solar energy!'
              : 'Try adjusting your filters'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
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
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll}>
              {/* Price Range */}
              <Text style={styles.filterLabel}>Price Range (₹/kWh)</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.minPrice}
                  onChangeText={(val) => setFilters({ ...filters, minPrice: val })}
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(val) => setFilters({ ...filters, maxPrice: val })}
                />
              </View>

              {/* Energy Range */}
              <Text style={styles.filterLabel}>Energy Amount (kWh)</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.minEnergy}
                  onChangeText={(val) => setFilters({ ...filters, minEnergy: val })}
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.maxEnergy}
                  onChangeText={(val) => setFilters({ ...filters, maxEnergy: val })}
                />
              </View>

              {/* Listing Type */}
              <Text style={styles.filterLabel}>Listing Type</Text>
              <View style={styles.typeButtons}>
                {['all', 'spot', 'forward', 'subscription'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      filters.listingType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setFilters({ ...filters, listingType: type })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        filters.listingType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Renewable Only */}
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
                <Text style={styles.checkboxLabel}>Renewable Energy Only</Text>
              </TouchableOpacity>

              {/* Radius Filter (only for nearby view) */}
              {viewMode === 'nearby' && (
                <>
                  <Text style={styles.filterLabel}>Search Radius (km)</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Radius in kilometers"
                    keyboardType="numeric"
                    value={filters.radius}
                    onChangeText={(val) => setFilters({ ...filters, radius: val })}
                  />
                  <Text style={styles.helperText}>
                    Current: {filters.radius || '50'} km radius
                  </Text>
                </>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


