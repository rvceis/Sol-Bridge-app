import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NearbyUsersScreen from '../screens/location/NearbyUsersScreen';
import SmartAllocationScreen from '../screens/location/SmartAllocationScreen';
import UserProfileScreen from '../screens/location/UserProfileScreen';
import ChatScreen from '../screens/location/ChatScreen';

const Stack = createNativeStackNavigator();

export default function DiscoveryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NearbyUsers" component={NearbyUsersScreen} />
      <Stack.Screen 
        name="SmartAllocation" 
        component={SmartAllocationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
}
