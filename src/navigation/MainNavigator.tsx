/**
 * Solar Energy Sharing Platform - Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store';
import DeviceStackNavigator from './DeviceStackNavigator';
import ProfileNavigator from './ProfileNavigator';
import MarketplaceNavigator from './MarketplaceNavigator';
import DiscoveryNavigator from './DiscoveryNavigator';
import WalletNavigator from './WalletNavigator';

// Screen imports
import {
  HomeScreen,
  EnergyScreen,
} from '../screens/main';
import AIInsightsScreen from '../screens/insights/AIInsightsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
}

const TabIcon: React.FC<TabIconProps> = ({
  focused,
  color,
  size,
  name,
  focusedName,
}) => {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? focusedName : name}
        size={size}
        color={color}
      />
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

const MainNavigator: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isHost = user?.role === 'host';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="home-outline"
              focusedName="home"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Energy"
        component={EnergyScreen}
        options={{
          tabBarLabel: isHost ? 'Production' : 'Usage',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={isHost ? 'sunny-outline' : 'flash-outline'}
              focusedName={isHost ? 'sunny' : 'flash'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Marketplace"
        component={MarketplaceNavigator}
        options={{
          tabBarLabel: 'Marketplace',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="storefront-outline"
              focusedName="storefront"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoveryNavigator}
        options={{
          tabBarLabel: 'Nearby',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="location-outline"
              focusedName="location"
            />
          ),
        }}
      />

      {isHost && (
        <Tab.Screen
          name="Devices"
          component={DeviceStackNavigator}
          options={{
            tabBarLabel: 'Devices',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={size}
                name="cube-outline"
                focusedName="cube"
              />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="AI"
        component={AIInsightsScreen}
        options={{
          tabBarLabel: 'AI',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="bulb-outline"
              focusedName="bulb"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletNavigator}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="wallet-outline"
              focusedName="wallet"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="person-outline"
              focusedName="person"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    height: Platform.OS === 'ios' ? 88 : 64,
    elevation: 8,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.main,
  },
});

export default MainNavigator;
