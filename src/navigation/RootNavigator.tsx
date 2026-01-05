/**
 * Solar Energy Sharing Platform - Root Navigator
 * Main navigation container with auth state handling
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootStackParamList } from './types';
import { colors } from '../theme';
import { useAuthStore } from '../store';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom navigation theme
const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background.primary,
    card: colors.background.primary,
    text: colors.text.primary,
    border: colors.border.light,
    primary: colors.primary.main,
  },
};

const RootNavigator: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  const status = useAuthStore((state) => state.status);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuthStatus();
      setIsReady(true);
    };

    initAuth();
  }, [checkAuthStatus]);

  // Show loading while checking auth
  if (!isReady || status === 'idle') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthNavigator isOnboarded={isOnboarded} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default RootNavigator;
