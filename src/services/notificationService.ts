/**
 * Notification Service - Expo Push Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for notifications');
      return false;
    }

    return true;
  },

  /**
   * Get Expo push token
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.warn('No EAS project ID found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Schedule local notification
   */
  async scheduleNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  },

  /**
   * Show payment success notification
   */
  async showPaymentSuccess(amount: number) {
    await this.scheduleNotification(
      'Payment Successful! 🎉',
      `₹${amount} has been added to your wallet`,
      { type: 'payment_success', amount }
    );
  },

  /**
   * Show payment failure notification
   */
  async showPaymentFailure(reason: string) {
    await this.scheduleNotification(
      'Payment Failed ❌',
      reason || 'Your payment could not be processed',
      { type: 'payment_failure' }
    );
  },

  /**
   * Show listing sold notification
   */
  async showListingSold(listingId: string, amount: number) {
    await this.scheduleNotification(
      'Energy Sold! ⚡',
      `You earned ₹${amount} from your energy listing`,
      { type: 'listing_sold', listingId, amount }
    );
  },

  /**
   * Show verification approved notification
   */
  async showVerificationApproved() {
    await this.scheduleNotification(
      'Verification Approved! ✅',
      'You can now sell energy on the marketplace',
      { type: 'verification_approved' }
    );
  },

  /**
   * Add notification listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  },
};
