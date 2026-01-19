import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { marketplaceApi } from '../../api/marketplaceService';
import { useAuthStore } from '../../store';

interface Device {
  device_id: string;
  device_name: string;
  device_type: string;
  capacity_kwh?: number;
  efficiency_rating?: number;
  installation_date?: string;
  status?: string;
  created_at: string;
  metadata?: {
    manufacturer?: string;
    serial_number?: string;
    location?: string;
  };
}

const DEVICE_TYPES = [
  { value: 'solar_panel', label: 'Solar Panel', icon: 'sunny' },
  { value: 'wind_turbine', label: 'Wind Turbine', icon: 'cloudy' },
  { value: 'battery', label: 'Battery Storage', icon: 'battery-charging' },
  { value: 'smart_meter', label: 'Smart Meter', icon: 'speedometer' },
  { value: 'inverter', label: 'Inverter', icon: 'flash' },
  { value: 'ev_charger', label: 'EV Charger', icon: 'car' },
  { value: 'other', label: 'Other', icon: 'cube' },
];

export default function DeviceManagementScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const canManageDevices = user?.role === 'host' || user?.role === 'buyer';
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('solar_panel');
  const [capacity, setCapacity] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await marketplaceApi.getMyDevices();
      setDevices(response.data || []);
    } catch (error: any) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const resetForm = () => {
    setDeviceName('');
    setDeviceType('solar_panel');
    setCapacity('');
    setEfficiency('');
    setManufacturer('');
    setSerialNumber('');
    setInstallationDate('');
    setLocation('');
    setEditingDevice(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setDeviceName(device.device_name);
    setDeviceType(device.device_type);
    setCapacity(device.capacity_kwh?.toString() || '');
    setEfficiency(device.efficiency_rating?.toString() || '');
    setManufacturer(device.metadata?.manufacturer || '');
    setSerialNumber(device.metadata?.serial_number || '');
    setInstallationDate(device.installation_date || '');
    setLocation(device.metadata?.location || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }

    // Validate installation date format if provided
    if (installationDate.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(installationDate.trim())) {
        Alert.alert('Error', 'Installation date must be in YYYY-MM-DD format');
        return;
      }
      // Verify it's a valid date
      const dateObj = new Date(installationDate.trim());
      if (isNaN(dateObj.getTime())) {
        Alert.alert('Error', 'Please enter a valid date');
        return;
      }
    }

    setSaving(true);
    try {
      const deviceData = {
        device_name: deviceName.trim(),
        device_type: deviceType,
        capacity_kwh: capacity ? parseFloat(capacity) : null,
        efficiency_rating: efficiency ? parseFloat(efficiency) : null,
        installation_date: installationDate.trim() || null,
        metadata: {
          manufacturer: manufacturer.trim() || null,
          serial_number: serialNumber.trim() || null,
          location: location.trim() || null,
        },
      };

      if (editingDevice) {
        // Update existing device
        await marketplaceApi.updateDevice(editingDevice.device_id, deviceData);
        Alert.alert('Success', 'Device updated successfully');
      } else {
        // Create new device
        await marketplaceApi.createDevice(deviceData);
        Alert.alert('Success', 'Device added successfully');
      }

      setModalVisible(false);
      resetForm();
      loadDevices();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save device';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (device: Device) => {
    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete "${device.device_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketplaceApi.deleteDevice(device.device_id);
              Alert.alert('Success', 'Device deleted');
              loadDevices();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete device');
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (type: string) => {
    const deviceType = DEVICE_TYPES.find((d) => d.value === type);
    return deviceType?.icon || 'cube';
  };

  const getDeviceLabel = (type: string) => {
    const deviceType = DEVICE_TYPES.find((d) => d.value === type);
    return deviceType?.label || type;
  };

  const renderDeviceCard = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.deviceIcon}>
        <Ionicons
          name={getDeviceIcon(item.device_type) as any}
          size={32}
          color="#4CAF50"
        />
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.device_name}</Text>
        <Text style={styles.deviceType}>{getDeviceLabel(item.device_type)}</Text>
        
        <View style={styles.deviceStats}>
          {item.capacity_kwh && (
            <View style={styles.statBadge}>
              <Ionicons name="flash" size={12} color="#FF9800" />
              <Text style={styles.statText}>{item.capacity_kwh} kWh</Text>
            </View>
          )}
          {item.efficiency_rating && (
            <View style={styles.statBadge}>
              <Ionicons name="speedometer" size={12} color="#2196F3" />
              <Text style={styles.statText}>{item.efficiency_rating}%</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="hardware-chip-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Devices Added</Text>
      <Text style={styles.emptyText}>
        {canManageDevices 
          ? 'Add your solar panels, batteries, and other devices to start trading energy'
          : 'No devices connected yet'}
      </Text>
      {canManageDevices && (
        <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.emptyButtonText}>Add Your First Device</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Devices</Text>
        {canManageDevices && (
          <TouchableOpacity onPress={openAddModal}>
            <Ionicons name="add-circle" size={28} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>

      {/* Device List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDeviceCard}
          keyExtractor={(item) => item.device_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Device Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Device Name *</Text>
                <TextInput
                  style={styles.input}
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder="e.g., Rooftop Solar Panel 1"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Device Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Device Type *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeSelector}
                >
                  {DEVICE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        deviceType === type.value && styles.typeOptionActive,
                      ]}
                      onPress={() => setDeviceType(type.value)}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={24}
                        color={deviceType === type.value ? '#FFF' : '#666'}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          deviceType === type.value && styles.typeOptionTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Capacity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Capacity (kWh)</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="e.g., 10"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Efficiency */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Efficiency Rating (%)</Text>
                <TextInput
                  style={styles.input}
                  value={efficiency}
                  onChangeText={setEfficiency}
                  placeholder="e.g., 85"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Manufacturer */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Manufacturer</Text>
                <TextInput
                  style={styles.input}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                  placeholder="e.g., Tesla, LG, Panasonic"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Serial Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="e.g., SN123456789"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Installation Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Installation Date</Text>
                <TextInput
                  style={styles.input}
                  value={installationDate}
                  onChangeText={setInstallationDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Rooftop, Backyard"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingDevice ? 'Update' : 'Add Device'}
                  </Text>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  deviceStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    minWidth: 80,
  },
  typeOptionActive: {
    backgroundColor: '#4CAF50',
  },
  typeOptionText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
