/**
 * Solar Energy Sharing Platform - Device Stack Navigator
 * Navigation stack for device management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

// Screen imports
import DeviceManagementScreen from '../screens/devices/DeviceManagementScreen';

export type DeviceStackParamList = {
  DeviceList: undefined;
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
    </Stack.Navigator>
  );
};

export default DeviceStackNavigator;
