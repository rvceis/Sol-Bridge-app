import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { marketplaceApi } from '../../api/marketplaceService';
import { useResponsive } from '../../hooks/useResponsive';
import { safeToFixed } from '../../utils/formatters';

interface Device {
  device_id: string;
  device_name: string;
  device_type: string;
}

export default function CreateListingScreen() {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  // Form state
  const [selectedDevice, setSelectedDevice] = useState('');
  const [energyAmount, setEnergyAmount] = useState('');
  const [pricePerKwh, setPricePerKwh] = useState('');
  const [listingType, setListingType] = useState<'spot' | 'forward' | 'subscription'>('spot');
  const [minPurchase, setMinPurchase] = useState('1');
  const [availableFrom, setAvailableFrom] = useState(new Date());
  const [availableTo, setAvailableTo] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [renewableCert, setRenewableCert] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: insets.top + 12,
      paddingHorizontal: responsive.screenPadding,
      paddingBottom: responsive.screenPadding,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: '#FFF',
      padding: responsive.screenPadding,
      marginTop: responsive.cardPadding,
    },
    sectionTitle: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginBottom: responsive.screenPadding,
    },
    deviceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: responsive.screenPadding,
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 12,
      marginBottom: responsive.cardPadding,
    },
    deviceOptionSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#F0F8FF',
    },
    deviceInfo: {
      flex: 1,
      marginLeft: responsive.screenPadding,
    },
    deviceName: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    deviceType: {
      fontSize: 12 * responsive.fontScale,
      color: '#666',
      marginTop: 2,
      textTransform: 'capitalize',
    },
    label: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
      marginBottom: responsive.gridGap,
      marginTop: responsive.cardPadding,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 12,
      paddingHorizontal: responsive.screenPadding,
      backgroundColor: '#FFF',
    },
    input: {
      flex: 1,
      paddingVertical: responsive.cardPadding,
      paddingHorizontal: responsive.cardPadding,
      fontSize: 16 * responsive.fontScale,
    },
    calculator: {
      backgroundColor: '#F9F9F9',
      padding: responsive.screenPadding,
      borderRadius: 12,
      marginTop: responsive.screenPadding,
    },
    calculatorTitle: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginBottom: responsive.cardPadding,
    },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: responsive.gridGap,
    },
    calcLabel: {
      fontSize: 13 * responsive.fontScale,
      color: '#666',
    },
    calcValue: {
      fontSize: 13 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    calcTotal: {
      marginTop: responsive.gridGap,
      paddingTop: responsive.cardPadding,
      borderTopWidth: 1,
      borderTopColor: '#DDD',
    },
    calcTotalLabel: {
      fontSize: 15 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    calcTotalValue: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#4CAF50',
    },
    typeButtons: {
      flexDirection: 'row',
      gap: responsive.cardPadding,
    },
    typeButton: {
      flex: 1,
      paddingVertical: responsive.cardPadding,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DDD',
      backgroundColor: '#FFF',
      alignItems: 'center',
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
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 12,
      paddingHorizontal: responsive.screenPadding,
      paddingVertical: responsive.cardPadding * 1.4,
      marginBottom: responsive.cardPadding,
    },
    dateText: {
      flex: 1,
      fontSize: 14 * responsive.fontScale,
      color: '#333',
      marginLeft: responsive.cardPadding,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxContent: {
      flex: 1,
      marginLeft: responsive.cardPadding,
    },
    checkboxLabel: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    checkboxDesc: {
      fontSize: 12 * responsive.fontScale,
      color: '#666',
      marginTop: 2,
    },
    footer: {
      backgroundColor: '#FFF',
      padding: responsive.screenPadding,
      borderTopWidth: 1,
      borderTopColor: '#EEE',
    },
    createButton: {
      flexDirection: 'row',
      backgroundColor: '#4CAF50',
      paddingVertical: responsive.cardPadding * 1.6,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButtonDisabled: {
      backgroundColor: '#CCC',
    },
    createButtonText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#FFF',
      marginLeft: responsive.gridGap,
    },
  });

  useEffect(() => {
    loadUserDevices();
  }, []);

  const loadUserDevices = async () => {
    try {
      const response = await marketplaceApi.getMyDevices();
      if (response.success && response.data) {
        setDevices(response.data);
        if (response.data.length > 0 && !selectedDevice) {
          setSelectedDevice(response.data[0].device_id);
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      // Fallback to empty devices - user can still create listing without device
      setDevices([]);
    }
  };

  const calculateTotalPrice = () => {
    const amount = parseFloat(energyAmount) || 0;
    const price = parseFloat(pricePerKwh) || 0;
    return amount * price;
  };

  const calculatePlatformFee = () => {
    return calculateTotalPrice() * 0.05; // 5% platform fee
  };

  const calculateSellerEarnings = () => {
    return calculateTotalPrice() - calculatePlatformFee();
  };

  const validateForm = () => {
    // Device selection is optional - users can create listings without devices

    if (!energyAmount || parseFloat(energyAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid energy amount');
      return false;
    }

    if (!pricePerKwh || parseFloat(pricePerKwh) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per kWh');
      return false;
    }

    if (!minPurchase || parseFloat(minPurchase) <= 0) {
      Alert.alert('Invalid Minimum', 'Please enter a valid minimum purchase amount');
      return false;
    }

    if (parseFloat(minPurchase) > parseFloat(energyAmount)) {
      Alert.alert(
        'Invalid Minimum',
        'Minimum purchase cannot be greater than total energy'
      );
      return false;
    }

    if (availableFrom >= availableTo) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return false;
    }

    return true;
  };

  const handleCreateListing = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const listingData: any = {
        energy_amount_kwh: parseFloat(energyAmount),
        price_per_kwh: parseFloat(pricePerKwh),
        available_from: availableFrom.toISOString(),
        available_to: availableTo.toISOString(),
        listing_type: listingType,
        min_purchase_kwh: parseFloat(minPurchase),
        renewable_cert: renewableCert,
      };

      // Only include device_id if one is selected
      if (selectedDevice) {
        listingData.device_id = selectedDevice;
      }

      await marketplaceApi.createListing(listingData);

      Alert.alert(
        'Listing Created!',
        'Your energy listing has been created successfully.',
        [
          { text: 'View Marketplace', onPress: () => navigation.goBack() },
          { text: 'Create Another', onPress: resetForm },
        ]
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create listing';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEnergyAmount('');
    setPricePerKwh('');
    setMinPurchase('1');
    setListingType('spot');
    setRenewableCert(false);
    setAvailableFrom(new Date());
    setAvailableTo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Device Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Device</Text>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.device_id}
              style={[
                styles.deviceOption,
                selectedDevice === device.device_id && styles.deviceOptionSelected,
              ]}
              onPress={() => setSelectedDevice(device.device_id)}
            >
              <Ionicons
                name={
                  selectedDevice === device.device_id
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={24}
                color={selectedDevice === device.device_id ? '#007AFF' : '#999'}
              />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.device_name}</Text>
                <Text style={styles.deviceType}>{device.device_type.replace('_', ' ')}</Text>
              </View>
              <Ionicons name="hardware-chip" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Energy Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Details</Text>

          <Text style={styles.label}>Energy Amount (kWh) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="flash" size={20} color="#FF9800" />
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              keyboardType="numeric"
              value={energyAmount}
              onChangeText={setEnergyAmount}
            />
          </View>

          <Text style={styles.label}>Minimum Purchase (kWh) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="arrow-down-circle" size={20} color="#9C27B0" />
            <TextInput
              style={styles.input}
              placeholder="e.g., 1"
              keyboardType="numeric"
              value={minPurchase}
              onChangeText={setMinPurchase}
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <Text style={styles.label}>Price per kWh (₹) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash" size={20} color="#4CAF50" />
            <TextInput
              style={styles.input}
              placeholder="e.g., 5.50"
              keyboardType="numeric"
              value={pricePerKwh}
              onChangeText={setPricePerKwh}
            />
          </View>

          {/* Price Calculator */}
          {energyAmount && pricePerKwh && (
            <View style={styles.calculator}>
              <Text style={styles.calculatorTitle}>Earnings Calculator</Text>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Total Price</Text>
                <Text style={styles.calcValue}>₹{safeToFixed(calculateTotalPrice(), 2)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Platform Fee (5%)</Text>
                <Text style={styles.calcValue}>-₹{safeToFixed(calculatePlatformFee(), 2)}</Text>
              </View>
              <View style={[styles.calcRow, styles.calcTotal]}>
                <Text style={styles.calcTotalLabel}>You'll Earn</Text>
                <Text style={styles.calcTotalValue}>₹{safeToFixed(calculateSellerEarnings(), 2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Listing Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Type</Text>
          <View style={styles.typeButtons}>
            {(['spot', 'forward', 'subscription'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  listingType === type && styles.typeButtonActive,
                ]}
                onPress={() => setListingType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    listingType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability Period</Text>

          <Text style={styles.label}>Available From</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateText}>{availableFrom.toLocaleDateString()}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          <Text style={styles.label}>Available To</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowToPicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateText}>{availableTo.toLocaleDateString()}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          {showFromPicker && (
            <DateTimePicker
              value={availableFrom}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowFromPicker(false);
                if (date) setAvailableFrom(date);
              }}
              minimumDate={new Date()}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={availableTo}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowToPicker(false);
                if (date) setAvailableTo(date);
              }}
              minimumDate={availableFrom}
            />
          )}
        </View>

        {/* Renewable Certification */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRenewableCert(!renewableCert)}
          >
            <Ionicons
              name={renewableCert ? 'checkbox' : 'square-outline'}
              size={24}
              color={renewableCert ? '#4CAF50' : '#999'}
            />
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>Renewable Energy Certified</Text>
              <Text style={styles.checkboxDesc}>
                Energy is generated from renewable sources
              </Text>
            </View>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateListing}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.createButtonText}>Create Listing</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

