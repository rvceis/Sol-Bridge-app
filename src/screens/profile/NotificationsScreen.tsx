import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(0);
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState({
    push: true,
    email: true,
    sms: false,
    marketing: true,
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
      setNotifications({
        push: prefs.notifications_push ?? true,
        email: prefs.notifications_email ?? true,
        sms: prefs.notifications_sms ?? false,
        marketing: prefs.notifications_marketing ?? true,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPref = async (key: string, value: boolean) => {
    const prefKey = `notifications_${key}`;
    try {
      await profileApi.updatePreferences({ [prefKey]: value });
      setNotifications({ ...notifications, [key]: value });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update notification preferences');
      // Revert the change
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
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Ionicons name="notifications" size={24} color="#007AFF" style={styles.icon} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>Push Notifications</Text>
                <Text style={styles.notificationDesc}>Device and app alerts</Text>
              </View>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(val) => updateNotificationPref('push', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={notifications.push ? '#4CAF50' : '#999'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Ionicons name="mail" size={24} color="#FF9800" style={styles.icon} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>Email Notifications</Text>
                <Text style={styles.notificationDesc}>Important updates via email</Text>
              </View>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(val) => updateNotificationPref('email', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={notifications.email ? '#4CAF50' : '#999'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Ionicons name="call" size={24} color="#2196F3" style={styles.icon} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>SMS Notifications</Text>
                <Text style={styles.notificationDesc}>Important alerts via SMS</Text>
              </View>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={(val) => updateNotificationPref('sms', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={notifications.sms ? '#4CAF50' : '#999'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Ionicons name="megaphone" size={24} color="#9C27B0" style={styles.icon} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>Marketing Emails</Text>
                <Text style={styles.notificationDesc}>Offers and promotions</Text>
              </View>
            </View>
            <Switch
              value={notifications.marketing}
              onValueChange={(val) => updateNotificationPref('marketing', val)}
              trackColor={{ false: '#DDD', true: '#81C784' }}
              thumbColor={notifications.marketing ? '#4CAF50' : '#999'}
            />
          </View>
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 12,
    color: '#999',
  },
});
