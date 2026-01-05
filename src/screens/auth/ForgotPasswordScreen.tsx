/**
 * Solar Energy Sharing Platform - Forgot Password Screen
 * Request password reset email
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography, layout } from '../../theme';
import { authService } from '../../api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const isValid = email.includes('@');

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const animateSuccess = () => {
    Animated.spring(successAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleResetPassword = async () => {
    if (!isValid) {
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset({ email });

      if (response.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEmailSent(true);
        animateSuccess();
      } else {
        setError(response.message || 'Failed to send reset email');
        shakeError();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login', { email });
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    successAnim.setValue(0);
    await handleResetPassword();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Success Content */}
        <Animated.View
          style={[
            styles.successContainer,
            {
              transform: [{ scale: successAnim }],
              opacity: successAnim,
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={[colors.success.main, colors.success.dark]}
              style={styles.successIcon}
            >
              <Ionicons name="mail" size={48} color={colors.neutral.white} />
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a password reset link to
          </Text>
          <Text style={styles.successEmail}>{email}</Text>

          <Text style={styles.successInstructions}>
            Click the link in your email to reset your password. If you don't see
            it, check your spam folder.
          </Text>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleBackToLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary.main, colors.primary.dark]}
              style={styles.backToLoginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
          >
            <Text style={styles.resendText}>
              Didn't receive the email?{' '}
              <Text style={styles.resendLink}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={40} color={colors.primary.main} />
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </Text>
        </View>

        {/* Form */}
        <Animated.View
          style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View
            style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={emailFocused ? colors.primary.main : colors.text.tertiary}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.text.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, !isValid && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isValid
                  ? [colors.primary.main, colors.primary.dark]
                  : [colors.neutral.gray300, colors.neutral.gray400]
              }
              style={styles.resetButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.neutral.white} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={colors.neutral.white} />
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Back to Login */}
        <TouchableOpacity style={styles.loginLink} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={16} color={colors.primary.main} />
          <Text style={styles.loginLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  backButton: {
    marginTop: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error.main,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: layout.inputHeight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '20',
  },
  input: {
    flex: 1,
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  resetButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonGradient: {
    height: layout.buttonLarge,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resetButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  loginLinkText: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  successIconContainer: {
    marginBottom: spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  successEmail: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary.main,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  successInstructions: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  backToLoginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    marginBottom: spacing.lg,
  },
  backToLoginGradient: {
    height: layout.buttonLarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  resendLink: {
    color: colors.primary.main,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
