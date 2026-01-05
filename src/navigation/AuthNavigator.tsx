/**
 * Solar Energy Sharing Platform - Auth Navigator
 * Handles authentication flow screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { colors } from '../theme';

// Screen imports
import {
  OnboardingScreen,
  RoleSelectionScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  VerifyEmailScreen,
} from '../screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  isOnboarded: boolean;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ isOnboarded }) => {
  return (
    <Stack.Navigator
      initialRouteName={isOnboarded ? 'Login' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      {/* Onboarding - Only show if not onboarded */}
      {!isOnboarded && (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            animation: 'fade',
          }}
        />
      )}

      {/* Role Selection */}
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />

      {/* Login */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Register */}
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Forgot Password */}
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Verify Email */}
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
