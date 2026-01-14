/**
 * Solar Energy Sharing Platform - Device Stack Navigator
 * Navigation stack for device management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

// Screen imports
import { DeviceManagementScreen } from '../screens/main';
import AddDeviceScreen from '../screens/host/AddDeviceScreen';
import DeviceDetailScreen from '../screens/host/DeviceDetailScreen';

export type DeviceStackParamList = {
  DeviceList: undefined;
  AddDevice: undefined;
  DeviceDetail: { deviceId: string };
};

const Stack = createNativeStackNavigator<DeviceStackParamList>();

const DeviceStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DeviceList"
        component={DeviceManagementScreen}
        options={{}}
      />

      <Stack.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{}}
      />

      <Stack.Screen
        name="DeviceDetail"
        component={DeviceDetailScreen}
        options={{}}
      />
    </Stack.Navigator>
  );
};

export default DeviceStackNavigator;
