/**
 * Solar Energy Sharing Platform - Add Device Screen
 * Register new IoT devices
 */

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DeviceStackParamList } from '../../navigation/DeviceStackNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, layout } from '../../theme';
import { useDeviceStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<DeviceStackParamList, 'AddDevice'>;

const DEVICE_TYPES = [
  { label: 'Solar Meter', value: 'solar_meter' },
  { label: 'Solar Panel (device)', value: 'solar_panel' },
  { label: 'Consumption Meter', value: 'consumption_meter' },
  { label: 'Battery BMS', value: 'battery_bms' },
  { label: 'Weather Station', value: 'weather_station' },
];

const AddDeviceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const createDevice = useDeviceStore((state) => state.createDevice);
  const isLoading = useDeviceStore((state) => state.isLoading);
  const error = useDeviceStore((state) => state.error);
  const clearError = useDeviceStore((state) => state.clearError);

  const [deviceType, setDeviceType] = useState<string>('solar_meter');
  const [deviceModel, setDeviceModel] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showDeviceTypeMenu, setShowDeviceTypeMenu] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isValid = deviceType.length > 0;

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddDevice = async () => {
    if (!isValid) {
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    clearError();
    // Map solar_panel to solar_meter for backend compatibility
    const submitType = deviceType === 'solar_panel' ? 'solar_meter' : deviceType;
    const success = await createDevice(submitType, deviceModel || undefined, firmwareVersion || undefined);

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } else {
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.logoContainer}
          >
            <Ionicons name="cube" size={40} color={colors.neutral.white} />
          </LinearGradient>

          <Text style={styles.title}>Add New Device</Text>
          <Text style={styles.subtitle}>
            Register your IoT device to start monitoring
          </Text>
        </View>

        {/* Form */}
        <Animated.View
          style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Device Type Selection */}
          <View>
            <Text style={styles.label}>Device Type *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDeviceTypeMenu(!showDeviceTypeMenu)}
            >
              <Text style={styles.dropdownButtonText}>
                {DEVICE_TYPES.find((t) => t.value === deviceType)?.label}
              </Text>
              <Ionicons
                name={showDeviceTypeMenu ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>
            
            {showDeviceTypeMenu && (
              <View style={styles.dropdownMenu}>
                {DEVICE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      deviceType === type.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setDeviceType(type.value);
                      setShowDeviceTypeMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        deviceType === type.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Device Model Input */}
          <View>
            <Text style={styles.label}>Device Model (Optional)</Text>
            <View
              style={[
                styles.inputContainer,
                focused === 'model' && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="information-outline"
                size={20}
                color={focused === 'model' ? colors.primary.main : colors.text.tertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., SMA SunnyBoy"
                placeholderTextColor={colors.text.placeholder}
                value={deviceModel}
                onChangeText={setDeviceModel}
                onFocus={() => setFocused('model')}
                onBlur={() => setFocused(null)}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Firmware Version Input */}
          <View>
            <Text style={styles.label}>Firmware Version (Optional)</Text>
            <View
              style={[
                styles.inputContainer,
                focused === 'firmware' && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="code-outline"
                size={20}
                color={focused === 'firmware' ? colors.primary.main : colors.text.tertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., v2.1.0"
                placeholderTextColor={colors.text.placeholder}
                value={firmwareVersion}
                onChangeText={setFirmwareVersion}
                onFocus={() => setFocused('firmware')}
                onBlur={() => setFocused(null)}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.info.main}
            />
            <Text style={styles.infoText}>
              Device type is required. Selecting "Solar Panel (device)" registers it like a solar meter but specifies the panel.
            </Text>
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, !isValid && styles.addButtonDisabled]}
            onPress={handleAddDevice}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary.main, colors.primary.dark]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.neutral.white}
                />
              ) : (
                <Text style={styles.addButtonText}>Add Device</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Spacing */}
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
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.error.main,
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
    color: colors.neutral.white,
    flex: 1,
  },
  label: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.white,
    marginBottom: spacing.lg,
    height: 50,
  },
  dropdownButtonText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    marginTop: -spacing.lg - 10,
    paddingTop: 50,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary.light + '20',
  },
  dropdownItemText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  dropdownItemTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.white,
    marginBottom: spacing.lg,
    height: layout.buttonMedium,
  },
  inputContainerFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '20',
  },
  input: {
    flex: 1,
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.info.main,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoText: {
    ...typography.textStyles.bodySmall,
    color: colors.info.main,
    flex: 1,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    height: layout.buttonLarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  cancelButton: {
    height: layout.buttonMedium,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.textStyles.buttonMedium,
    color: colors.text.primary,
  },
});

export default AddDeviceScreen;
