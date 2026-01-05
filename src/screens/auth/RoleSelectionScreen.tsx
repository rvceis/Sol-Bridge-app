/**
 * Solar Energy Sharing Platform - Role Selection Screen
 * Choose between Host, Buyer, or Investor roles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography, gradients } from '../../theme';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;

interface RoleOption {
  id: 'host' | 'buyer' | 'investor';
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  benefits: string[];
}

const roles: RoleOption[] = [
  {
    id: 'host',
    title: 'Energy Host',
    subtitle: 'Share Your Power',
    description: 'You have solar panels and want to sell excess energy to your community.',
    icon: 'sunny',
    gradient: [colors.primary.main, colors.primary.dark],
    benefits: ['Earn from excess energy', 'Set your own rates', 'Real-time monitoring'],
  },
  {
    id: 'buyer',
    title: 'Energy Buyer',
    subtitle: 'Power Your Life',
    description: 'You want to buy clean, affordable solar energy from local hosts.',
    icon: 'flash',
    gradient: [colors.secondary.main, colors.secondary.dark],
    benefits: ['Save on energy bills', 'Support clean energy', 'Flexible plans'],
  },
  {
    id: 'investor',
    title: 'Energy Investor',
    subtitle: 'Grow Your Impact',
    description: 'Invest in community solar projects and earn returns while going green.',
    icon: 'trending-up',
    gradient: [colors.success.main, colors.success.dark],
    benefits: ['Earn dividends', 'Green investment', 'Community impact'],
  },
];

const RoleCard: React.FC<{
  role: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ role, isSelected, onSelect }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { transform: [{ scale: scaleAnim }] },
        isSelected && styles.cardSelected,
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Selected Indicator */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
          </View>
        )}

        {/* Icon */}
        <LinearGradient
          colors={role.gradient as [string, string]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={role.icon} size={28} color={colors.neutral.white} />
        </LinearGradient>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.roleTitle}>{role.title}</Text>
          <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
          <Text style={styles.roleDescription}>{role.description}</Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            {role.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={colors.success.main}
                />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedRole, setSelectedRole] = useState<'host' | 'buyer' | 'investor' | null>(
    null
  );

  const handleRoleSelect = async (roleId: 'host' | 'buyer' | 'investor') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Register', { role: selectedRole });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Role</Text>
        <Text style={styles.headerSubtitle}>
          How do you want to participate in the energy community?
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRole === role.id}
            onSelect={() => handleRoleSelect(role.id)}
          />
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedRole
                ? [colors.primary.main, colors.primary.dark]
                : [colors.neutral.gray300, colors.neutral.gray400]
            }
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={colors.neutral.white}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginTextBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    shadowColor: colors.primary.main,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  roleTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: 2,
  },
  roleSubtitle: {
    ...typography.textStyles.caption,
    color: colors.primary.main,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  benefitsContainer: {
    gap: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  benefitText: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.lg,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  loginTextBold: {
    fontWeight: '700',
    color: colors.primary.main,
  },
});

export default RoleSelectionScreen;
