import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { WalletStackParamList } from './types';
import { colors } from '../theme';

// Wallet Screens
import WalletScreen from '../screens/main/WalletScreen';
import TopUpScreen from '../screens/wallet/TopUpScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export const WalletNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="WalletOverview" 
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TopUp" 
        component={TopUpScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Top Up Wallet',
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

export default WalletNavigator;
