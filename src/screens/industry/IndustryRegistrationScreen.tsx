/**
 * Industry Registration Form - Register Energy Needs
 * Specify daily demand, budget, operational hours
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store';

const INDUSTRY_TYPES = [
  'Manufacturing',
  'Textile',
  'Food Processing',
  'Chemical',
  'Pharmaceutical',
  'IT/Software',
  'Warehouse',
  'Cold Storage',
  'Other',
];

export default function IndustryRegistrationScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    company_name: '',
    industry_type: '',
    daily_energy_demand_kwh: '',
    monthly_budget: '',
    max_price_per_kwh: '',
    operational_hours_per_day: '24',
    peak_demand_hours: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night' | 'all-day',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    has_grid_backup: true,
    requires_24x7_supply: false,
    willing_to_sign_long_term_contract: false,
    contract_duration_preference_months: '12',
  });

  const [submitting, setSubmitting] = useState(false);

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Auto-calculate monthly budget from daily demand
    if (key === 'daily_energy_demand_kwh' && value) {
      const dailyDemand = parseFloat(value);
      const monthlyDemand = dailyDemand * 30;
      const estimatedBudget = monthlyDemand * 8; // Assuming ₹8/kWh avg
      setFormData((prev) => ({
        ...prev,
        monthly_budget: estimatedBudget.toFixed(0),
        max_price_per_kwh: '10',
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.company_name) {
      Alert.alert('Validation Error', 'Please enter company name');
      return false;
    }

    if (!formData.industry_type) {
      Alert.alert('Validation Error', 'Please select industry type');
      return false;
    }

    if (!formData.daily_energy_demand_kwh || parseFloat(formData.daily_energy_demand_kwh) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid daily energy demand');
      return false;
    }

    if (!formData.max_price_per_kwh || parseFloat(formData.max_price_per_kwh) <= 0) {
      Alert.alert('Validation Error', 'Please enter maximum price willing to pay');
      return false;
    }

    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Validation Error', 'Please fill all address fields');
      return false;
    }

    if (!formData.contact_person || !formData.contact_phone || !formData.contact_email) {
      Alert.alert('Validation Error', 'Please fill all contact details');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const monthlyDemand = parseFloat(formData.daily_energy_demand_kwh) * 30;
    const monthlyCost = monthlyDemand * parseFloat(formData.max_price_per_kwh);

    Alert.alert(
      'Confirm Registration',
      `Register ${formData.company_name} with ${formData.daily_energy_demand_kwh} kWh daily demand?\n\nEstimated monthly cost: ₹${monthlyCost.toFixed(0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register', onPress: submitForm },
      ]
    );
  };

  const submitForm = async () => {
    try {
      setSubmitting(true);

      const response = await apiClient.post('/industry/register', formData);

      Alert.alert(
        'Registration Successful! 🎉',
        `${formData.company_name} is now registered. Our AI will match you with best solar suppliers based on your requirements.`,
        [
          {
            text: 'Browse Suppliers',
            onPress: () => navigation.navigate('FindSuppliers' as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to register industry:', error);
      Alert.alert('Registration Failed', error.response?.data?.error || 'Failed to register industry');
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
        <Text style={styles.headerTitle}>Register Industry</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC Manufacturing Ltd"
              value={formData.company_name}
              onChangeText={(value) => updateFormData('company_name', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Industry Type *</Text>
            <View style={styles.industryTypesGrid}>
              {INDUSTRY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.industryTypeButton,
                    formData.industry_type === type && styles.industryTypeButtonActive,
                  ]}
                  onPress={() => updateFormData('industry_type', type)}
                >
                  <Text
                    style={[
                      styles.industryTypeText,
                      formData.industry_type === type && styles.industryTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Energy Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Requirements</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Energy Demand (kWh) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1000"
              keyboardType="numeric"
              value={formData.daily_energy_demand_kwh}
              onChangeText={(value) => updateFormData('daily_energy_demand_kwh', value)}
            />
            <Text style={styles.helperText}>Average daily consumption in kWh</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Price per kWh (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 8"
              keyboardType="numeric"
              value={formData.max_price_per_kwh}
              onChangeText={(value) => updateFormData('max_price_per_kwh', value)}
            />
            <Text style={styles.helperText}>Maximum price you're willing to pay</Text>
          </View>

          {formData.daily_energy_demand_kwh && formData.max_price_per_kwh && (
            <View style={styles.estimateCard}>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Monthly Demand</Text>
                <Text style={styles.estimateValue}>
                  {(parseFloat(formData.daily_energy_demand_kwh) * 30).toFixed(0)} kWh
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Estimated Monthly Cost</Text>
                <Text style={[styles.estimateValue, { color: '#2196F3' }]}>
                  ₹
                  {(
                    parseFloat(formData.daily_energy_demand_kwh) *
                    30 *
                    parseFloat(formData.max_price_per_kwh)
                  ).toFixed(0)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operational Hours per Day</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 12"
              keyboardType="numeric"
              value={formData.operational_hours_per_day}
              onChangeText={(value) => updateFormData('operational_hours_per_day', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peak Demand Hours</Text>
            <View style={styles.peakHoursRow}>
              {[
                { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
                { key: 'afternoon', label: 'Afternoon', icon: 'sunny' },
                { key: 'evening', label: 'Evening', icon: 'partly-sunny' },
                { key: 'night', label: 'Night', icon: 'moon' },
                { key: 'all-day', label: 'All Day', icon: 'time' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.peakButton,
                    formData.peak_demand_hours === period.key && styles.peakButtonActive,
                  ]}
                  onPress={() => updateFormData('peak_demand_hours', period.key)}
                >
                  <Ionicons
                    name={period.icon as any}
                    size={18}
                    color={formData.peak_demand_hours === period.key ? '#FFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.peakText,
                      formData.peak_demand_hours === period.key && styles.peakTextActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Factory/facility address"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => updateFormData('state', value)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit pincode"
              keyboardType="numeric"
              maxLength={6}
              value={formData.pincode}
              onChangeText={(value) => updateFormData('pincode', value)}
            />
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Person</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact person name"
              value={formData.contact_person}
              onChangeText={(value) => updateFormData('contact_person', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.contact_phone}
              onChangeText={(value) => updateFormData('contact_phone', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="email@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.contact_email}
              onChangeText={(value) => updateFormData('contact_email', value)}
            />
          </View>
        </View>

        {/* Additional Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Preferences</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updateFormData('has_grid_backup', !formData.has_grid_backup)}
          >
            <View style={[styles.checkbox, formData.has_grid_backup && styles.checkboxChecked]}>
              {formData.has_grid_backup && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>We have grid backup available</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              updateFormData('requires_24x7_supply', !formData.requires_24x7_supply)
            }
          >
            <View
              style={[
                styles.checkbox,
                formData.requires_24x7_supply && styles.checkboxChecked,
              ]}
            >
              {formData.requires_24x7_supply && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Require 24/7 continuous supply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              updateFormData(
                'willing_to_sign_long_term_contract',
                !formData.willing_to_sign_long_term_contract
              )
            }
          >
            <View
              style={[
                styles.checkbox,
                formData.willing_to_sign_long_term_contract && styles.checkboxChecked,
              ]}
            >
              {formData.willing_to_sign_long_term_contract && (
                <Ionicons name="checkmark" size={18} color="#FFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Willing to sign long-term contract</Text>
          </TouchableOpacity>

          {formData.willing_to_sign_long_term_contract && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Contract Duration (months)</Text>
              <View style={styles.durationRow}>
                {['6', '12', '24', '36'].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      formData.contract_duration_preference_months === duration &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => updateFormData('contract_duration_preference_months', duration)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        formData.contract_duration_preference_months === duration &&
                          styles.durationTextActive,
                      ]}
                    >
                      {duration}mo
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              <Text style={styles.submitButtonText}>Register Company</Text>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#333' },
  helperText: { fontSize: 12, color: '#999', marginTop: 6 },
  industryTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  industryTypeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: 'transparent' },
  industryTypeButtonActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  industryTypeText: { fontSize: 13, fontWeight: '600', color: '#666' },
  industryTypeTextActive: { color: '#2196F3' },
  estimateCard: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2196F3', marginBottom: 16 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  estimateLabel: { fontSize: 14, color: '#666' },
  estimateValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  peakHoursRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  peakButton: { flex: 1, minWidth: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#F0F0F0', gap: 6 },
  peakButtonActive: { backgroundColor: '#4CAF50' },
  peakText: { fontSize: 12, fontWeight: '600', color: '#666' },
  peakTextActive: { color: '#FFF' },
  row: { flexDirection: 'row' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkboxLabel: { fontSize: 14, color: '#333', flex: 1 },
  durationRow: { flexDirection: 'row', gap: 12 },
  durationButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  durationButtonActive: { backgroundColor: '#4CAF50' },
  durationText: { fontSize: 14, fontWeight: '600', color: '#666' },
  durationTextActive: { color: '#FFF' },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2196F3', paddingVertical: 16, borderRadius: 12, gap: 8 },
  submitButtonDisabled: { backgroundColor: '#CCC' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
