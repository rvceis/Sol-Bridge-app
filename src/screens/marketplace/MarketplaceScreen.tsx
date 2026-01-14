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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { marketplaceApi } from '../../api/marketplaceService';

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
}

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minEnergy: '',
    maxEnergy: '',
    listingType: 'all',
    renewableOnly: false,
  });

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, filters]);

  const loadListings = async () => {
    try {
      const response = await marketplaceApi.getListings({
        status: 'active',
      });
      setListings(response.data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
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
    });
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const totalPrice = item.energy_amount_kwh * item.price_per_kwh;

    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => navigation.navigate('ListingDetail' as never, { listingId: item.id } as never)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sellerInfo}>
            <Ionicons name="person-circle" size={32} color="#007AFF" />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{item.seller_name}</Text>
              <Text style={styles.deviceName}>{item.device_name || 'Solar Device'}</Text>
            </View>
          </View>
          {item.renewable_cert && (
            <View style={styles.certBadge}>
              <Ionicons name="leaf" size={16} color="#4CAF50" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.energyInfo}>
            <Ionicons name="flash" size={20} color="#FF9800" />
            <Text style={styles.energyAmount}>{item.energy_amount_kwh.toFixed(2)} kWh</Text>
          </View>

          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceAmount}>₹{item.price_per_kwh.toFixed(2)}/kWh</Text>
            <Text style={styles.totalPrice}>Total: ₹{totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{item.listing_type.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.availabilityText}>
            Available {new Date(item.available_from).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Energy Marketplace</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateListing' as never)}
        >
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
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
                {['all', 'spot', 'scheduled', 'subscription'].map((type) => (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  createButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
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
    paddingHorizontal: 12,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
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
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceName: {
    fontSize: 12,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  energyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  totalPrice: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  typeChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
    textTransform: 'capitalize',
  },
  availabilityText: {
    fontSize: 11,
    color: '#999',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  filterScroll: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  rangeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#999',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
