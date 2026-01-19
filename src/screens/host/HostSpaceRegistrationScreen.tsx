/**
 * Host Space Registration Form - Register Panel Capacity
 * Upload photos, structural certification, set pricing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';

export default function HostSpaceRegistrationScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    property_type: 'rooftop' as 'rooftop' | 'ground' | 'both',
    available_area_sqft: '',
    estimated_capacity_kw: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    monthly_rent_per_kw: '',
    has_structural_certificate: false,
    is_near_industry: false,
    distance_to_nearest_industry_km: '',
  });

  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [certificateUri, setCertificateUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Auto-calculate capacity from area (1 kW = ~100 sqft)
    if (key === 'available_area_sqft' && value) {
      const capacity = (parseFloat(value) / 100).toFixed(1);
      setFormData((prev) => ({ ...prev, estimated_capacity_kw: capacity }));
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setPropertyImages([...propertyImages, ...uris].slice(0, 5));
    }
  };

  const pickCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (result.type === 'success') {
      setCertificateUri(result.uri);
      updateFormData('has_structural_certificate', true);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        // Use expo-location here
        Alert.alert('Location', 'Location feature will be implemented with expo-location');
        // For now, set dummy coordinates
        updateFormData('latitude', '28.6139');
        updateFormData('longitude', '77.2090');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.available_area_sqft || parseFloat(formData.available_area_sqft) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid available area');
      return false;
    }

    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Validation Error', 'Please fill all address fields');
      return false;
    }

    if (!formData.monthly_rent_per_kw || parseFloat(formData.monthly_rent_per_kw) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid monthly rent per kW');
      return false;
    }

    if (propertyImages.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one property image');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Registration',
      `Register ${formData.estimated_capacity_kw} kW capacity at ₹${formData.monthly_rent_per_kw}/kW/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register', onPress: submitForm },
      ]
    );
  };

  const submitForm = async () => {
    try {
      setSubmitting(true);

      // In production, upload images to cloud storage first
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key as keyof typeof formData] as any);
      });

      propertyImages.forEach((uri, index) => {
        formDataToSend.append('property_images', {
          uri,
          type: 'image/jpeg',
          name: `property_${index}.jpg`,
        } as any);
      });

      if (certificateUri) {
        formDataToSend.append('structural_certificate', {
          uri: certificateUri,
          type: 'application/pdf',
          name: 'structural_certificate.pdf',
        } as any);
      }

      const response = await apiClient.post('/host/register-space', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Registration Successful! 🎉',
        `Your property is now listed with ${formData.estimated_capacity_kw} kW capacity. Buyers will be able to find and invest in your space.`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('HostDashboard' as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to register space:', error);
      Alert.alert('Registration Failed', error.response?.data?.error || 'Failed to register space');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Panel Space</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.optionsRow}>
            {(['rooftop', 'ground', 'both'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.optionButton, formData.property_type === type && styles.optionButtonActive]}
                onPress={() => updateFormData('property_type', type)}
              >
                <Ionicons
                  name={type === 'rooftop' ? 'home' : type === 'ground' ? 'layers' : 'apps'}
                  size={20}
                  color={formData.property_type === type ? '#FFF' : '#666'}
                />
                <Text
                  style={[styles.optionText, formData.property_type === type && styles.optionTextActive]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Area & Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Space</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available Area (sq ft)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5000"
              keyboardType="numeric"
              value={formData.available_area_sqft}
              onChangeText={(value) => updateFormData('available_area_sqft', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Capacity (kW)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#F0F0F0' }]}
              placeholder="Auto-calculated"
              keyboardType="numeric"
              value={formData.estimated_capacity_kw}
              editable={false}
            />
            <Text style={styles.helperText}>
              Auto-calculated: 1 kW ≈ 100 sq ft (can be adjusted)
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Building name, street address"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => updateFormData('state', value)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit pincode"
              keyboardType="numeric"
              maxLength={6}
              value={formData.pincode}
              onChangeText={(value) => updateFormData('pincode', value)}
            />
          </View>

          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Ionicons name="location" size={16} color="#007AFF" />
            <Text style={styles.locationButtonText}>Use Current Location (GPS)</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Rent per kW (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1000"
              keyboardType="numeric"
              value={formData.monthly_rent_per_kw}
              onChangeText={(value) => updateFormData('monthly_rent_per_kw', value)}
            />
            <Text style={styles.helperText}>
              Typical range: ₹800-₹1500/kW/month depending on location
            </Text>
          </View>

          {formData.estimated_capacity_kw && formData.monthly_rent_per_kw && (
            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>Expected Monthly Rent</Text>
              <Text style={styles.estimateValue}>
                ₹
                {(
                  parseFloat(formData.estimated_capacity_kw) * parseFloat(formData.monthly_rent_per_kw)
                ).toFixed(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Property Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Images (Max 5)</Text>
          <Text style={styles.helperText}>Upload clear photos of your roof/ground space</Text>

          <ScrollView horizontal style={styles.imageScroll}>
            {propertyImages.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setPropertyImages(propertyImages.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}

            {propertyImages.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                <Ionicons name="camera" size={32} color="#999" />
                <Text style={styles.addImageText}>Add Photos</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Structural Certificate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Structural Certificate (Optional)</Text>
          <Text style={styles.helperText}>
            Upload structural engineer's certificate to increase buyer confidence
          </Text>

          {certificateUri ? (
            <View style={styles.certificateCard}>
              <Ionicons name="document-text" size={32} color="#4CAF50" />
              <View style={styles.certificateInfo}>
                <Text style={styles.certificateName}>structural_certificate.pdf</Text>
                <Text style={styles.certificateStatus}>✓ Uploaded</Text>
              </View>
              <TouchableOpacity onPress={() => setCertificateUri(null)}>
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickCertificate}>
              <Ionicons name="cloud-upload" size={20} color="#007AFF" />
              <Text style={styles.uploadButtonText}>Upload Certificate (PDF)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updateFormData('is_near_industry', !formData.is_near_industry)}
          >
            <View
              style={[styles.checkbox, formData.is_near_industry && styles.checkboxChecked]}
            >
              {formData.is_near_industry && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Property is near industrial area</Text>
          </TouchableOpacity>

          {formData.is_near_industry && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Distance to Nearest Industry (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5"
                keyboardType="numeric"
                value={formData.distance_to_nearest_industry_km}
                onChangeText={(value) => updateFormData('distance_to_nearest_industry_km', value)}
              />
            </View>
          )}
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Register My Space</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  scrollView: { flex: 1 },
  section: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F0F0F0', gap: 8 },
  optionButtonActive: { backgroundColor: '#4CAF50' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  optionTextActive: { color: '#FFF' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#333' },
  helperText: { fontSize: 12, color: '#999', marginTop: 6 },
  row: { flexDirection: 'row' },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD', paddingVertical: 12, borderRadius: 10, marginTop: 8, gap: 8 },
  locationButtonText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  estimateCard: { backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50', alignItems: 'center' },
  estimateLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  estimateValue: { fontSize: 28, fontWeight: '700', color: '#4CAF50' },
  imageScroll: { flexDirection: 'row' },
  imageContainer: { position: 'relative', marginRight: 12 },
  image: { width: 120, height: 120, borderRadius: 12 },
  removeImageButton: { position: 'absolute', top: -8, right: -8 },
  addImageButton: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addImageText: { fontSize: 12, color: '#999', marginTop: 6 },
  certificateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, gap: 12 },
  certificateInfo: { flex: 1 },
  certificateName: { fontSize: 14, fontWeight: '600', color: '#333' },
  certificateStatus: { fontSize: 12, color: '#4CAF50', marginTop: 4 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD', paddingVertical: 14, borderRadius: 10, gap: 8 },
  uploadButtonText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkboxLabel: { fontSize: 14, color: '#333', flex: 1 },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 12, gap: 8 },
  submitButtonDisabled: { backgroundColor: '#CCC' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
