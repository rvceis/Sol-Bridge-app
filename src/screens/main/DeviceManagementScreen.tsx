/**
 * Solar Energy Sharing Platform - Device Management Screen
 * Browse, add, and manage IoT devices
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DeviceStackParamList } from '../../navigation/DeviceStackNavigator';
import { colors, spacing, typography, gradients } from '../../theme';
import { useDeviceStore, useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<DeviceStackParamList>;

const DeviceManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const user = useAuthStore((state) => state.user);
  const isHost = user?.role === 'host';

  const devices = useDeviceStore((state) => state.devices);
  const isLoading = useDeviceStore((state) => state.isLoading);
  const isRefreshing = useDeviceStore((state) => state.isRefreshing);
  const error = useDeviceStore((state) => state.error);
  const fetchDevices = useDeviceStore((state) => state.fetchDevices);
  const selectDevice = useDeviceStore((state) => state.selectDevice);
  const refreshDevices = useDeviceStore((state) => state.refreshDevices);
  const clearError = useDeviceStore((state) => state.clearError);

  useEffect(() => {
    fetchDevices();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh devices when screen is focused (user navigates back from detail)
      refreshDevices();
    }, [refreshDevices])
  );

  const handleAddDevice = async () => {
    if (!isHost) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddDevice');
  };

  const handleDevicePress = async (device: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectDevice(device);
    navigation.navigate('DeviceDetail', { deviceId: device.device_id });
  };

  const getDeviceIcon = (deviceType: string): keyof typeof Ionicons.glyphMap => {
    switch (deviceType) {
      case 'solar_meter':
        return 'sunny';
      case 'consumption_meter':
        return 'flash';
      case 'battery_bms':
        return 'battery-full';
      case 'weather_station':
        return 'cloud';
      default:
        return 'cube';
    }
  };

  const getDeviceColor = (deviceType: string): string => {
    switch (deviceType) {
      case 'solar_meter':
        return colors.primary.main;
      case 'consumption_meter':
        return colors.secondary.main;
      case 'battery_bms':
        return colors.success.main;
      case 'weather_station':
        return colors.info.main;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return colors.success.main;
      case 'inactive':
        return colors.warning.main;
      case 'faulty':
        return colors.error.main;
      default:
        return colors.text.tertiary;
    }
  };

  const renderDeviceCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      activeOpacity={0.8}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceCardHeader}>
        <View
          style={[
            styles.deviceIcon,
            { backgroundColor: getDeviceColor(item.device_type) + '20' },
          ]}
        >
          <Ionicons
            name={getDeviceIcon(item.device_type)}
            size={24}
            color={getDeviceColor(item.device_type)}
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.device_model || 'Device'}
          </Text>
          <Text style={styles.deviceType}>{item.device_type}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.deviceStats}>
        <View style={styles.statItem}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.text.tertiary}
          />
          <Text style={styles.statLabel}>
            {item.installation_date
              ? new Date(item.installation_date).toLocaleDateString()
              : 'Not installed'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.text.tertiary}
          />
          <Text style={styles.statLabel}>
            {item.last_seen_at
              ? new Date(item.last_seen_at).toLocaleTimeString()
              : 'Never'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={gradients.solarSunrise.colors}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Devices</Text>
            <Text style={styles.headerSubtitle}>
              {isHost ? 'Manage your solar devices' : 'View connected devices'}
            </Text>
          </View>

          {isHost && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDevice}
            >
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={colors.neutral.white}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Error Message */}
      {error && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={clearError}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={colors.error.main}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Ionicons
            name="close"
            size={16}
            color={colors.error.main}
          />
        </TouchableOpacity>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : devices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="cube-outline"
            size={64}
            color={colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>No Devices</Text>
          <Text style={styles.emptySubtitle}>
            {isHost
              ? 'Add your first device to get started'
              : 'No devices connected yet'}
          </Text>
          {isHost && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddDevice}
            >
              <Text style={styles.emptyButtonText}>Add Device</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDeviceCard}
          keyExtractor={(item) => item.device_id}
          scrollEnabled={false}
          contentContainerStyle={styles.deviceList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshDevices}
              tintColor={colors.primary.main}
            />
          }
        />
      )}

      {/* Bottom Spacing */}
      <View style={{ height: 100 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.textStyles.h1,
    color: colors.neutral.white,
  },
  headerSubtitle: {
    ...typography.textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.error.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.error.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: colors.error.main,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
  },
  emptyButtonText: {
    ...typography.textStyles.buttonMedium,
    color: colors.neutral.white,
  },
  deviceList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  deviceType: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },
  deviceStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
});

export default DeviceManagementScreen;
