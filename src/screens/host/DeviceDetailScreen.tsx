/**
 * Solar Energy Sharing Platform - Device Detail Screen
 * View, edit, and manage individual device
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DeviceStackParamList } from '../../navigation/DeviceStackNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, layout } from '../../theme';
import { useDeviceStore } from '../../store';
import { ProductionCard } from '../../components/cards/ProductionCard';

type NavigationProp = NativeStackNavigationProp<DeviceStackParamList, 'DeviceDetail'>;

const DEVICE_TYPE_ICONS: Record<string, string> = {
  solar_meter: 'sun',
  consumption_meter: 'flash',
  battery_bms: 'battery-half',
  weather_station: 'cloud',
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  solar_meter: 'Solar Meter',
  consumption_meter: 'Consumption Meter',
  battery_bms: 'Battery BMS',
  weather_station: 'Weather Station',
};

const DEVICE_TYPE_COLORS: Record<string, string> = {
  solar_meter: colors.primary.main,
  consumption_meter: colors.secondary.main,
  battery_bms: colors.success.main,
  weather_station: colors.info.main,
};

const STATUS_COLORS: Record<string, string> = {
  active: colors.success.main,
  inactive: colors.warning.main,
  faulty: colors.error.main,
};

interface Device {
  device_id: string;
  device_type: string;
  device_model?: string;
  firmware_version?: string;
  status: string;
  installed_at?: string;
  installation_date?: string;
  last_seen_at?: string;
  configuration?: Record<string, any>;
}

const DeviceDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { deviceId } = route.params;

  const devices = useDeviceStore((state) => state.devices);
  const deleteDevice = useDeviceStore((state) => state.deleteDevice);
  const updateDevice = useDeviceStore((state) => state.updateDevice);
  const isLoading = useDeviceStore((state) => state.isLoading);
  const error = useDeviceStore((state) => state.error);
  const clearError = useDeviceStore((state) => state.clearError);

  const device = devices.find((d) => d.device_id === deviceId) as Device | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editedModel, setEditedModel] = useState(device?.device_model || '');
  const [editedVersion, setEditedVersion] = useState(device?.firmware_version || '');
  const [focused, setFocused] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  if (!device) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error.main} />
          <Text style={styles.notFoundText}>Device not found</Text>
        </View>
      </View>
    );
  }

  const handleSaveEdit = async () => {
    clearError();
    const success = await updateDevice(deviceId, {
      device_model: editedModel || undefined,
      firmware_version: editedVersion || undefined,
    });

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCancelEdit = () => {
    setEditedModel(device?.device_model || '');
    setEditedVersion(device?.firmware_version || '');
    setIsEditing(false);
  };

  const handleDeleteDevice = () => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            clearError();
            const success = await deleteDevice(deviceId);
            if (success) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleBack = () => {
    if (isEditing) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            onPress: handleCancelEdit,
            style: 'destructive',
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const deviceColor = DEVICE_TYPE_COLORS[device.device_type];
  const deviceIcon = DEVICE_TYPE_ICONS[device.device_type];
  const deviceLabel = DEVICE_TYPE_LABELS[device.device_type];
  const statusColor = STATUS_COLORS[device.status];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Device Details</Text>

          <TouchableOpacity
            style={[styles.headerButton, isEditing && styles.headerButtonActive]}
            onPress={() => setIsEditing(!isEditing)}
            disabled={isLoading}
          >
            <Ionicons
              name={isEditing ? 'close' : 'pencil'}
              size={24}
              color={isEditing ? colors.error.main : colors.primary.main}
            />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Device Card */}
        <Animated.View style={[styles.deviceCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[deviceColor + '20', deviceColor + '10']}
            style={styles.deviceCardGradient}
          >
            <View style={styles.deviceCardTop}>
              <View
                style={[styles.deviceIcon, { backgroundColor: deviceColor + '30' }]}
              >
                <Ionicons name={deviceIcon as any} size={32} color={deviceColor} />
              </View>

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceType}>{deviceLabel}</Text>
                <Text style={styles.deviceId} numberOfLines={1}>
                  ID: {device.device_id}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + '20' },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {/* Device Model */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons
                    name="information-outline"
                    size={18}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.detailLabelText}>Device Model</Text>
                </View>

                {isEditing ? (
                  <View
                    style={[
                      styles.inputContainer,
                      focused === 'model' && styles.inputContainerFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Not specified"
                      placeholderTextColor={colors.text.placeholder}
                      value={editedModel}
                      onChangeText={setEditedModel}
                      onFocus={() => setFocused('model')}
                      onBlur={() => setFocused(null)}
                      editable={!isLoading}
                    />
                  </View>
                ) : (
                  <Text style={styles.detailValue}>
                    {device.device_model || 'Not specified'}
                  </Text>
                )}
              </View>

              {/* Firmware Version */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons
                    name="code-outline"
                    size={18}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.detailLabelText}>Firmware Version</Text>
                </View>

                {isEditing ? (
                  <View
                    style={[
                      styles.inputContainer,
                      focused === 'version' && styles.inputContainerFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Not specified"
                      placeholderTextColor={colors.text.placeholder}
                      value={editedVersion}
                      onChangeText={setEditedVersion}
                      onFocus={() => setFocused('version')}
                      onBlur={() => setFocused(null)}
                      editable={!isLoading}
                    />
                  </View>
                ) : (
                  <Text style={styles.detailValue}>
                    {device.firmware_version || 'Not specified'}
                  </Text>
                )}
              </View>

              {/* Installation Date */}
              {device.installation_date && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.text.tertiary}
                    />
                    <Text style={styles.detailLabelText}>Installed</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {new Date(device.installation_date).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Last Seen */}
              {device.last_seen_at && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons
                      name="timer-outline"
                      size={18}
                      color={colors.text.tertiary}
                    />
                    <Text style={styles.detailLabelText}>Last Seen</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {new Date(device.last_seen_at).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Production Data Card */}
        {!isEditing && device.device_id && (
          <View style={styles.productionSection}>
            <ProductionCard 
              deviceId={device.device_id}
              title="Live Production"
              subtitle={device.device_id}
            />
          </View>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.neutral.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelEdit}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDeleteDevice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.error.main} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color={colors.error.main} />
                  <Text style={styles.deleteButtonText}>Delete Device</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: colors.error.light,
  },
  headerTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.error.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.error.main,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error.main,
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  deviceCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  deviceCardGradient: {
    padding: spacing.lg,
  },
  deviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceType: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  deviceId: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  detailsSection: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 0.4,
  },
  detailLabelText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 0.6,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 0.6,
    backgroundColor: colors.neutral.white,
  },
  inputContainerFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '20',
  },
  input: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
  },
  actionButtons: {
    gap: spacing.md,
  },
  button: {
    height: layout.buttonLarge,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.success.main,
  },
  saveButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    ...typography.textStyles.buttonMedium,
    color: colors.text.primary,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error.main + '30',
    backgroundColor: colors.error.light,
  },
  deleteButtonText: {
    ...typography.textStyles.buttonMedium,
    color: colors.error.main,
  },
  productionSection: {
    marginBottom: spacing.lg,
  },
});

export default DeviceDetailScreen;

