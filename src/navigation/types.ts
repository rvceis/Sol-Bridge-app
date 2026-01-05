/**
 * Solar Energy Sharing Platform - Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: { email?: string } | undefined;
  Register: { role?: 'host' | 'buyer' | 'investor' } | undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  ResetPassword: { token: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Energy: undefined;
  Wallet: undefined;
  Profile: undefined;
};

// Home Stack (inside tab)
export type HomeStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  DeviceDetails: { deviceId: string };
};

// Energy Stack
export type EnergyStackParamList = {
  EnergyOverview: undefined;
  EnergyHistory: { deviceId?: string };
  DeviceManagement: undefined;
  DeviceDetails: { deviceId: string };
  AddDevice: undefined;
};

// Wallet Stack
export type WalletStackParamList = {
  WalletOverview: undefined;
  TransactionHistory: undefined;
  TransactionDetails: { transactionId: string };
  Topup: undefined;
  Withdraw: undefined;
  PaymentSuccess: { transactionId: string };
  PaymentFailed: { reason?: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: undefined;
  Settings: undefined;
  HostSettings: undefined;
  BuyerSettings: undefined;
  Notifications: undefined;
  Security: undefined;
  Help: undefined;
  About: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens
  QRScanner: undefined;
  ImageViewer: { uri: string };
  WebView: { url: string; title?: string };
};

// Declare global types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
