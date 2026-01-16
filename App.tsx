/**
 * Solar Energy Sharing Platform - Main App Entry
 * Root component with providers
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Request notification permissions on app startup (silently fail in Expo Go)
    notificationService.requestPermissions().catch(() => {
      console.log('Notifications not available in Expo Go');
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
