import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors } from '../theme';

// Profile Screens
import ProfileScreen from '../screens/main/ProfileScreen';
import PersonalInformationScreen from '../screens/profile/PersonalInformationScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import DocumentsScreen from '../screens/profile/DocumentsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

export type ProfileStackParamList = {
  ProfileList: undefined;
  PersonalInfo: undefined;
  Address: undefined;
  PaymentMethods: undefined;
  Documents: undefined;
  Notifications: undefined;
  Security: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        gestureEnabled: true,
      })}
    >
      <Stack.Screen 
        name="ProfileList" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PersonalInfo" 
        component={PersonalInformationScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Personal Information',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="Address" 
        component={AddressScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Addresses',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Payment Methods',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'KYC Documents',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Notifications',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="Security" 
        component={SecurityScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Security',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Settings',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
            color: colors.text.primary,
          },
        })}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
