/**
 * COMPONENT INTEGRATION GUIDE
 * 
 * This file shows how to use the 4 new components together
 * in your React Native screens.
 */

// ============================================
// 1. NearbyUsersListItem Component
// ============================================
import NearbyUsersListItem from '../components/cards/NearbyUsersListItem';

/**
 * USAGE: Display individual seller cards in a FlatList
 * 
 * import { FlatList } from 'react-native';
 * 
 * const NearbyUsersScreen = () => {
 *   const [users, setUsers] = useState([]);
 * 
 *   const handleSelectUser = (user) => {
 *     // Handle user selection
 *   };
 * 
 *   const handleViewProfile = (userId) => {
 *     navigation.navigate('UserProfile', { userId });
 *   };
 * 
 *   return (
 *     <FlatList
 *       data={users}
 *       renderItem={({ item }) => (
 *         <NearbyUsersListItem
 *           user={item}
 *           onPress={handleSelectUser}
 *           onViewProfile={handleViewProfile}
 *         />
 *       )}
 *       keyExtractor={(item) => item.id}
 *     />
 *   );
 * };
 */

// ============================================
// 2. SellerReliabilityCard Component
// ============================================
import SellerReliabilityCard from '../components/cards/SellerReliabilityCard';

/**
 * USAGE: Show seller reliability score when user selects a seller
 * 
 * const SellerDetailsScreen = ({ route }) => {
 *   const { sellerId } = route.params;
 *   const { authToken } = useContext(AuthContext);
 * 
 *   return (
 *     <ScrollView>
 *       <Text>Seller Details</Text>
 *       <SellerReliabilityCard
 *         sellerId={sellerId}
 *         authToken={authToken}
 *         onPress={() => {
 *           // Handle card press
 *         }}
 *       />
 *     </ScrollView>
 *   );
 * };
 */

// ============================================
// 3. DemandPredictionChart Component
// ============================================
import DemandPredictionChart from '../components/charts/DemandPredictionChart';

/**
 * USAGE: Show 7-day energy demand forecast with trends
 * 
 * const EnergyForecastScreen = () => {
 *   const [currentLocation, setCurrentLocation] = useState({
 *     latitude: 40.7128,
 *     longitude: -74.0060
 *   });
 * 
 *   return (
 *     <DemandPredictionChart
 *       latitude={currentLocation.latitude}
 *       longitude={currentLocation.longitude}
 *       days={7}
 *     />
 *   );
 * };
 */

// ============================================
// 4. DemandClusterMap Component
// ============================================
import DemandClusterMap from '../components/common/DemandClusterMap';

/**
 * USAGE: Show geographic hotspots and demand clusters
 * 
 * const DemandHotspotsScreen = () => {
 *   const handleClusterSelect = (cluster) => {
 *     console.log('Selected cluster:', cluster);
 *     // You can navigate to cluster details or show on a map
 *   };
 * 
 *   return (
 *     <DemandClusterMap
 *       limit={10}
 *       onClusterSelect={handleClusterSelect}
 *     />
 *   );
 * };
 */

// ============================================
// COMPLETE INTEGRATION EXAMPLE
// ============================================

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

/**
 * Complete Dashboard Screen using all 4 components
 */
export const LocationDashboardScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby', 'forecast', 'hotspots'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      fetchNearbyUsers(
        location.coords.latitude,
        location.coords.longitude
      );
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const fetchNearbyUsers = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/location/nearby-users?latitude=${lat}&longitude=${lng}&sort=distance&limit=20`
      );
      const result = await response.json();
      if (result.success) {
        setNearbyUsers(result.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleViewProfile = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  if (!currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <Text>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'nearby' ? '#3b82f6' : '#9ca3af'}
          />
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'forecast' && styles.activeTab]}
          onPress={() => setActiveTab('forecast')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'forecast' ? '#3b82f6' : '#9ca3af'}
          />
          <Text style={[styles.tabText, activeTab === 'forecast' && styles.activeTabText]}>
            Forecast
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'hotspots' && styles.activeTab]}
          onPress={() => setActiveTab('hotspots')}
        >
          <Ionicons
            name="flame"
            size={20}
            color={activeTab === 'hotspots' ? '#3b82f6' : '#9ca3af'}
          />
          <Text style={[styles.tabText, activeTab === 'hotspots' && styles.activeTabText]}>
            Hotspots
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'nearby' && (
        <FlatList
          data={nearbyUsers}
          renderItem={({ item }) => (
            <NearbyUsersListItem
              user={item}
              onPress={handleSelectUser}
              onViewProfile={handleViewProfile}
            />
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Sellers</Text>
              <Text style={styles.sectionSubtitle}>
                Showing {nearbyUsers.length} results
              </Text>
            </View>
          )}
          scrollEnabled={true}
        />
      )}

      {activeTab === 'forecast' && currentLocation && (
        <DemandPredictionChart
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
          days={7}
        />
      )}

      {activeTab === 'hotspots' && (
        <DemandClusterMap
          limit={10}
          onClusterSelect={(cluster) => {
            console.log('Selected cluster:', cluster);
          }}
        />
      )}

      {/* Selected User Detail Card */}
      {selectedUser && (
        <View style={styles.selectedUserContainer}>
          <SellerReliabilityCard
            sellerId={parseInt(selectedUser.id)}
            authToken={'your-auth-token'}
            onPress={() => handleViewProfile(selectedUser.id)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  selectedUserContainer: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
  },
});

// ============================================
// PROP TYPES REFERENCE
// ============================================

/**
 * NearbyUsersListItem Props:
 * - user: NearbyUserListItem (required)
 *   - id: string
 *   - full_name: string
 *   - role: 'seller' | 'investor' | 'hoster'
 *   - kyc_status: string
 *   - profile_image?: string
 *   - city: string
 *   - state: string
 *   - distance_km: number
 *   - active_listings: number
 *   - available_energy_kwh: number
 *   - average_rating: number
 *   - completed_transactions: number
 * - onPress: (user) => void (required)
 * - onViewProfile: (userId) => void (required)
 */

/**
 * SellerReliabilityCard Props:
 * - sellerId: number (required)
 * - authToken: string (required)
 * - onPress?: () => void (optional)
 */

/**
 * DemandPredictionChart Props:
 * - latitude: number (required)
 * - longitude: number (required)
 * - days?: number (optional, default: 7)
 */

/**
 * DemandClusterMap Props:
 * - limit?: number (optional, default: 10)
 * - onClusterSelect?: (cluster: Cluster) => void (optional)
 */

export default LocationDashboardScreen;
