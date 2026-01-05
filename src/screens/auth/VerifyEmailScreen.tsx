/**
 * Solar Energy Sharing Platform - Verify Email Screen
 * Email verification success/pending state
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography, layout } from '../../theme';
import { authService } from '../../api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type VerifyEmailRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VerifyEmailRouteProp>();
  const email = route.params?.email || '';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleResendEmail = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await authService.requestPasswordReset({ email });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBackToLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login', { email });
  };

  const handleOpenEmail = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, this would open the default email app
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={[colors.secondary.main, colors.secondary.dark]}
            style={styles.iconContainer}
          >
            <Ionicons name="mail-unread" size={56} color={colors.neutral.white} />
          </LinearGradient>

          {/* Ring animations */}
          <View style={[styles.ring, styles.ring1]} />
          <View style={[styles.ring, styles.ring2]} />
        </Animated.View>

        {/* Content */}
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Check your inbox for our email
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Click the verification link
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Start your energy journey!
            </Text>
          </View>
        </View>

        {/* Open Email Button */}
        <TouchableOpacity
          style={styles.openEmailButton}
          onPress={handleOpenEmail}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.openEmailGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="mail-open" size={20} color={colors.neutral.white} />
            <Text style={styles.openEmailText}>Open Email App</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Email */}
        <TouchableOpacity style={styles.resendButton} onPress={handleResendEmail}>
          <Text style={styles.resendText}>
            Didn't receive the email?{' '}
            <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>

        {/* Spam Notice */}
        <View style={styles.spamNotice}>
          <Ionicons
            name="information-circle"
            size={16}
            color={colors.text.tertiary}
          />
          <Text style={styles.spamText}>
            Check your spam folder if you can't find it
          </Text>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backToLoginButton}
          onPress={handleBackToLogin}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary.main} />
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondary.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.secondary.light,
    borderRadius: 100,
  },
  ring1: {
    width: 160,
    height: 160,
    opacity: 0.5,
  },
  ring2: {
    width: 200,
    height: 200,
    opacity: 0.3,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  email: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary.main,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  instructionsContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionNumberText: {
    ...typography.textStyles.label,
    color: colors.primary.main,
    fontWeight: '700',
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    flex: 1,
  },
  openEmailButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    marginBottom: spacing.md,
  },
  openEmailGradient: {
    height: layout.buttonLarge,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  openEmailText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  resendText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  resendLink: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  spamNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  spamText: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backToLoginText: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default VerifyEmailScreen;
