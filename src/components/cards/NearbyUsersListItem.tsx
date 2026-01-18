import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeToFixed } from '../../utils/formatters';

export interface NearbyUserListItem {
  id: string;
  full_name: string;
  role: string;
  kyc_status: string;
  profile_image?: string;
  city: string;
  state: string;
  distance_km: number;
  active_listings: number;
  available_energy_kwh: number;
  average_rating: number;
  completed_transactions: number;
}

interface NearbyUsersListItemProps {
  user: NearbyUserListItem;
  onPress: (user: NearbyUserListItem) => void;
  onViewProfile: (userId: string) => void;
}

const NearbyUsersListItem: React.FC<NearbyUsersListItemProps> = ({
  user,
  onPress,
  onViewProfile,
}) => {
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

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 5) return '#10b981'; // green - very close
    if (distance < 15) return '#3b82f6'; // blue - close
    if (distance < 50) return '#f59e0b'; // amber - moderate
    return '#ef4444'; // red - far
  };

  const getKYCIcon = (status: string) => {
    return status === 'verified' ? (
      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
    ) : (
      <Ionicons name="alert-circle" size={14} color="#f59e0b" />
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#9ca3af" />
            </View>
          )}
          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Ionicons name={getRoleIcon(user.role)} size={12} color="#fff" />
          </View>
          {/* KYC Status */}
          <View style={styles.kycBadge}>
            {getKYCIcon(user.kyc_status)}
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.roleLabel}>{getRoleLabel(user.role)}</Text>
          </View>
          <Text style={styles.location}>
            {user.city}, {user.state}
          </Text>
          
          {/* Rating and Transactions */}
          <View style={styles.statsRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={getRatingColor(user.average_rating)} />
              <Text style={[styles.rating, { color: getRatingColor(user.average_rating) }]}>
                {safeToFixed(user.average_rating, 1)}
              </Text>
              <Text style={styles.ratingLabel}>
                ({user.completed_transactions})
              </Text>
            </View>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.distanceContainer}>
          <View
            style={[
              styles.distanceCircle,
              { backgroundColor: getDistanceColor(user.distance_km) + '20' },
            ]}
          >
            <Ionicons
              name="location"
              size={16}
              color={getDistanceColor(user.distance_km)}
            />
          </View>
          <Text style={[styles.distance, { color: getDistanceColor(user.distance_km) }]}>
            {safeToFixed(user.distance_km, 1)}
          </Text>
          <Text style={styles.distanceUnit}>km</Text>
        </View>
      </View>

      {/* Metrics Section */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Ionicons name="list" size={16} color="#3b82f6" />
          <Text style={styles.metricLabel}>Listings</Text>
          <Text style={styles.metricValue}>{user.active_listings}</Text>
        </View>

        <View style={styles.metricBox}>
          <Ionicons name="lightning" size={16} color="#f59e0b" />
          <Text style={styles.metricLabel}>Available</Text>
          <Text style={styles.metricValue}>
            {user.available_energy_kwh > 1000
              ? safeToFixed(user.available_energy_kwh / 1000, 1)
              : safeToFixed(user.available_energy_kwh, 0)}
          </Text>
          <Text style={styles.metricUnit}>
            {user.available_energy_kwh > 1000 ? 'MWh' : 'kWh'}
          </Text>
        </View>

        <View style={styles.actionButton}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => onViewProfile(user.id)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Divider */}
      <View style={styles.detailsDivider} />

      {/* Quick Details */}
      <View style={styles.quickDetails}>
        <View style={styles.quickDetailItem}>
          <Ionicons name="checkmark-circle" size={14} color="#10b981" />
          <Text style={styles.quickDetailText}>
            {user.completed_transactions} transactions
          </Text>
        </View>
        <View style={styles.quickDetailItem}>
          <Ionicons name="time" size={14} color="#3b82f6" />
          <Text style={styles.quickDetailText}>Responsive seller</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  kycBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  distanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  distanceCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    fontWeight: '700',
  },
  distanceUnit: {
    fontSize: 10,
    color: '#9ca3af',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 2,
  },
  metricUnit: {
    fontSize: 8,
    color: '#9ca3af',
  },
  actionButton: {
    flex: 0.8,
  },
  viewProfileBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewProfileText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  quickDetails: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  quickDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickDetailText: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default NearbyUsersListItem;
