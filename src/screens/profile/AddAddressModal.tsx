import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressAdded: () => void;
}

export default function AddAddressModal({
  visible,
  onClose,
  onAddressAdded,
}: AddAddressModalProps) {
  const [formData, setFormData] = useState({
    address_type: 'home' as 'home' | 'work' | 'billing' | 'other',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });
  const [loading, setLoading] = useState(false);

  const handleAddAddress = async () => {
    // Validation
    if (!formData.address_line1.trim()) {
      Alert.alert('Error', 'Address line 1 is required');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'State is required');
      return;
    }
    if (!formData.postal_code.trim()) {
      Alert.alert('Error', 'Postal code is required');
      return;
    }

    setLoading(true);
    try {
      await profileApi.addAddress(formData);
      Alert.alert('Success', 'Address added successfully');
      setFormData({
        address_type: 'home',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        is_default: false,
      });
      onAddressAdded();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleToggleDefault = () => {
    setFormData({ ...formData, is_default: !formData.is_default });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Address</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <ScrollView style={styles.content}>
          {/* Address Type */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Address Type</Text>
            <View style={styles.typeContainer}>
              {['home', 'work', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.address_type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => handleInputChange('address_type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.address_type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address Line 1 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              placeholder="Street address"
              placeholderTextColor="#999"
              value={formData.address_line1}
              onChangeText={(value) => handleInputChange('address_line1', value)}
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Apartment, suite, etc. (optional)"
              placeholderTextColor="#999"
              value={formData.address_line2}
              onChangeText={(value) => handleInputChange('address_line2', value)}
            />
          </View>

          {/* City */}
          <View style={styles.formSection}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#999"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
            />
          </View>

          {/* State */}
          <View style={styles.formSection}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="State/Province"
              placeholderTextColor="#999"
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
            />
          </View>

          {/* Postal Code */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="Postal code"
              placeholderTextColor="#999"
              value={formData.postal_code}
              onChangeText={(value) => handleInputChange('postal_code', value)}
              keyboardType="number-pad"
            />
          </View>

          {/* Set as Default */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={handleToggleDefault}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.is_default && styles.checkboxActive,
                ]}
              >
                {formData.is_default && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddAddress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Address</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#CCC',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
