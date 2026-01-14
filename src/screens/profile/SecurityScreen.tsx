import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';

export default function SecurityScreen() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(0);
  const [loading, setLoading] = React.useState(true);
  const [security, setSecurity] = React.useState({
    twoFactor: false,
    biometric: false,
  });

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await profileApi.getPreferences();
      const prefs = response.data;
      setSecurity({
        twoFactor: prefs.security_two_factor ?? false,
        biometric: prefs.security_biometric ?? false,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load security preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateSecurityPref = async (key: string, value: boolean) => {
    const prefKey = `security_${key === 'twoFactor' ? 'two_factor' : 'biometric'}`;
    try {
      await profileApi.updatePreferences({ [prefKey]: value });
      setSecurity({ ...security, [key]: value });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update security preferences');
      loadPreferences();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[
        styles.header,
        { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Password & Authentication</Text>

          <TouchableOpacity style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <Ionicons name="lock-closed" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Change Password</Text>
              <Text style={styles.securityDesc}>Update your password regularly</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <Ionicons name="finger-print" size={24} color="#4CAF50" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Biometric Login</Text>
              <Text style={styles.securityDesc}>Enable fingerprint/face recognition</Text>
            </View>
            <Switch
              value={security.biometric}
              onValueChange={(val) => updateSecurityPref('biometric', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={security.biometric ? '#4CAF50' : '#999'}
            />
          </View>

          <View style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
              <Text style={styles.securityDesc}>Add extra layer of security</Text>
            </View>
            <Switch
              value={security.twoFactor}
              onValueChange={(val) => updateSecurityPref('twoFactor', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={security.twoFactor ? '#4CAF50' : '#999'}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Sessions</Text>

          <TouchableOpacity style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <Ionicons name="phone-portrait" size={24} color="#9C27B0" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Active Sessions</Text>
              <Text style={styles.securityDesc}>Manage your active logins</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityDesc: {
    fontSize: 12,
    color: '#999',
  },
});
