import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/main/ProfileScreen';
import PersonalInformationScreen from '../screens/profile/PersonalInformationScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import DocumentsScreen from '../screens/profile/DocumentsScreen';
import DocumentsManagementScreen from '../screens/profile/DocumentsManagementScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';

const Stack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileList" component={ProfileScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInformationScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="DocumentsManagement" component={DocumentsManagementScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
    </Stack.Navigator>
  );
}
