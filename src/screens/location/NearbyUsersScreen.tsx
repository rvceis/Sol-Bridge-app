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
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { locationApi } from '../../api/locationService';

const { width } = Dimensions.get('window');

interface NearbyUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  kyc_status: string;
  profile_image?: string;
  city: string;
  state: string;
  distance_km: number;
  active_listings: number;
  available_energy_kwh: number;
  device_count: number;
  average_rating: number;
  completed_transactions: number;
}

const USER_TYPE_OPTIONS = [
  { key: 'all', label: 'All', icon: 'people' },
  { key: 'seller', label: 'Sellers', icon: 'flash' },
  { key: 'investor', label: 'Investors', icon: 'trending-up' },
  { key: 'hoster', label: 'Hosters', icon: 'home' },
];

const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

export default function NearbyUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState('all');
  const [radius, setRadius] = useState(50);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadNearbyUsers();
    }
  }, [location, userType, radius]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location access.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get your location. Please try again.');
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    if (!location) return;

    try {
      const types = userType === 'all' 
        ? ['seller', 'investor', 'hoster'] 
        : [userType];

      const response = await locationApi.getNearbyUsers(
        location.latitude,
        location.longitude,
        radius,
        types
      );

      setUsers(response.data || []);
    } catch (error: any) {
      console.error('Error loading nearby users:', error);
      Alert.alert('Error', 'Failed to load nearby users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNearbyUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller':
        return '#4CAF50';
      case 'investor':
        return '#9C27B0';
      case 'hoster':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'seller':
        return 'flash';
      case 'investor':
        return 'trending-up';
      case 'hoster':
        return 'home';
      default:
        return 'person';
    }
  };

  const renderUserCard = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        // Navigate to user profile or start chat
        Alert.alert(
          item.full_name,
          `Contact this ${item.role}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Profile', onPress: () => {} },
            { text: 'Start Chat', onPress: () => {} },
          ]
        );
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Ionicons name={getRoleIcon(item.role) as any} size={28} color={getRoleColor(item.role)} />
            </View>
          )}
          {item.kyc_status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <View style={styles.roleContainer}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Ionicons name={getRoleIcon(item.role) as any} size={12} color={getRoleColor(item.role)} />
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={12} color="#999" /> {item.city || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{(item.distance_km || 0).toFixed(1)}</Text>
          <Text style={styles.distanceUnit}>km</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {item.role === 'seller' && (
          <>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color="#FF9800" />
              <Text style={styles.statValue}>{(item.available_energy_kwh || 0).toFixed(0)} kWh</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="list" size={16} color="#2196F3" />
              <Text style={styles.statValue}>{item.active_listings}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
          </>
        )}

        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="hardware-chip" size={16} color="#4CAF50" />
          <Text style={styles.statValue}>{item.device_count}</Text>
          <Text style={styles.statLabel}>Devices</Text>
        </View>

        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.statValue}>
            {(parseFloat(String(item.average_rating || 0))).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>

        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
          <Text style={styles.statValue}>{item.completed_transactions}</Text>
          <Text style={styles.statLabel}>Trades</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="location-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Users Found Nearby</Text>
      <Text style={styles.emptyText}>
        Try increasing the search radius or check back later
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadNearbyUsers}>
        <Ionicons name="refresh" size={20} color="#FFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocationError = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={64} color="#FF9800" />
      <Text style={styles.emptyTitle}>Location Required</Text>
      <Text style={styles.emptyText}>{locationError}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={getLocation}>
        <Ionicons name="location" size={20} color="#FFF" />
        <Text style={styles.retryButtonText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Users</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* User Type Filter */}
        <View style={styles.typeFilter}>
          {USER_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.typeOption,
                userType === option.key && styles.typeOptionActive,
              ]}
              onPress={() => setUserType(option.key)}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={userType === option.key ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  userType === option.key && styles.typeOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Radius Filter */}
        <View style={styles.radiusFilter}>
          <Text style={styles.radiusLabel}>Search Radius:</Text>
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusOption,
                  radius === r && styles.radiusOptionActive,
                ]}
                onPress={() => setRadius(r)}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    radius === r && styles.radiusOptionTextActive,
                  ]}
                >
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Results Count */}
      {!loading && location && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            Found <Text style={styles.resultsCount}>{users.length}</Text> users within {radius} km
          </Text>
        </View>
      )}

      {/* Content */}
      {locationError ? (
        renderLocationError()
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding nearby users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  typeFilter: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    gap: 4,
  },
  typeOptionActive: {
    backgroundColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#FFF',
  },
  radiusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 12,
  },
  radiusOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  radiusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  radiusOptionActive: {
    backgroundColor: '#4CAF50',
  },
  radiusOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  radiusOptionTextActive: {
    color: '#FFF',
  },
  resultsBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
  },
  resultsCount: {
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  distanceContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  distanceUnit: {
    fontSize: 10,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#F0F0F0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
