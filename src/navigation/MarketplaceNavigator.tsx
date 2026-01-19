import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import ListingDetailScreen from '../screens/marketplace/ListingDetailScreen';
import CreateListingScreen from '../screens/marketplace/CreateListingScreen';
import TransactionHistoryScreen from '../screens/marketplace/TransactionHistoryScreen';
import DeviceManagementScreen from '../screens/devices/DeviceManagementScreen';
import SmartAllocationScreen from '../screens/location/SmartAllocationScreen';
import FindEnergySourcesScreen from '../screens/marketplace/FindEnergySourcesScreen';

const Stack = createStackNavigator();

export default function MarketplaceNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MarketplaceMain" component={MarketplaceScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="Transactions" component={TransactionHistoryScreen} />
      <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
      <Stack.Screen name="SmartAllocation" component={SmartAllocationScreen} />
      <Stack.Screen name="FindEnergySources" component={FindEnergySourcesScreen} />
    </Stack.Navigator>
  );
}
