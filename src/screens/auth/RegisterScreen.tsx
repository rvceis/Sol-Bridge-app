/**
 * Solar Energy Sharing Platform - Register Screen
 * User registration with role-based fields
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../store';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterRouteProp>();

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.status === 'loading');
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const selectedRole = route.params?.role || 'buyer';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Field validation errors
  const fieldErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};
    if (touched.name && name.length < 2) errors.name = 'Name must be at least 2 characters';
    if (touched.email && !email.includes('@')) errors.email = 'Please enter a valid email';
    if (touched.email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email format';
    if (touched.password && password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (touched.confirmPassword && password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  }, [name, email, password, confirmPassword, touched]);

  const handleBlur = (field: string) => {
    setFocusedField(null);
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValid =
    name.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms;

  const passwordStrength = React.useMemo(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return colors.error.main;
    if (passwordStrength <= 3) return colors.warning.main;
    return colors.success.main;
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleRegister = async () => {
    if (!isValid) {
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    clearError();
    const success = await register({
      fullName: name,
      email,
      password,
      role: selectedRole,
      phone: phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('VerifyEmail', { email });
    } else {
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (selectedRole) {
      case 'host':
        return 'sunny';
      case 'investor':
        return 'trending-up';
      default:
        return 'flash';
    }
  };

  const getRoleColor = () => {
    switch (selectedRole) {
      case 'host':
        return colors.primary.main;
      case 'investor':
        return colors.success.main;
      default:
        return colors.secondary.main;
    }
  };

  const getRoleLabel = () => {
    switch (selectedRole) {
      case 'host':
        return 'Energy Host';
      case 'investor':
        return 'Investor';
      default:
        return 'Energy Buyer';
    }
  };

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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join as an {getRoleLabel()}</Text>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Ionicons name={getRoleIcon()} size={16} color={getRoleColor()} />
            <Text style={[styles.roleBadgeText, { color: getRoleColor() }]}>
              {getRoleLabel()}
            </Text>
          </View>
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

          {/* Name Input */}
          <View>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'name' && styles.inputContainerFocused,
                fieldErrors.name && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={fieldErrors.name ? colors.error.main : focusedField === 'name' ? colors.primary.main : colors.text.tertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={colors.text.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                onFocus={() => setFocusedField('name')}
                onBlur={() => handleBlur('name')}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
            {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}
          </View>

          {/* Email Input */}
          <View>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused,
                fieldErrors.email && styles.inputContainerError,
              ]}
            >
              <Ionicons
              name="mail-outline"
              size={20}
              color={fieldErrors.email ? colors.error.main : focusedField === 'email' ? colors.primary.main : colors.text.tertiary}
            />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.text.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onFocus={() => setFocusedField('email')}
              onBlur={() => handleBlur('email')}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>
          {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
          </View>

          {/* Phone Input (Optional) */}
          <View
            style={[
              styles.inputContainer,
              focusedField === 'phone' && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={focusedField === 'phone' ? colors.primary.main : colors.text.tertiary}
            />
            <TextInput
              ref={phoneRef}
              style={styles.input}
              placeholder="Phone number (optional)"
              placeholderTextColor={colors.text.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Password Input */}
          <View>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused,
                fieldErrors.password && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={fieldErrors.password ? colors.error.main : focusedField === 'password' ? colors.primary.main : colors.text.tertiary}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Password (8+ characters)"
                placeholderTextColor={colors.text.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => handleBlur('password')}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
          </View>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          level <= passwordStrength
                            ? getStrengthColor()
                            : colors.neutral.gray200,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                {getStrengthLabel()}
              </Text>
            </View>
          )}

          {/* Confirm Password Input */}
          <View>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'confirmPassword' && styles.inputContainerFocused,
                fieldErrors.confirmPassword && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={
                  fieldErrors.confirmPassword ? colors.error.main :
                  focusedField === 'confirmPassword'
                    ? colors.primary.main
                    : colors.text.tertiary
                }
              />
              <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.text.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {confirmPassword.length > 0 && (
              <Ionicons
                name={
                  password === confirmPassword ? 'checkmark-circle' : 'close-circle'
                }
                size={20}
                color={
                  password === confirmPassword ? colors.success.main : colors.error.main
                }
              />
            )}
          </View>
          {fieldErrors.confirmPassword && <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>}
          </View>

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={14} color={colors.neutral.white} />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, !isValid && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isValid
                  ? [colors.primary.main, colors.primary.dark]
                  : [colors.neutral.gray300, colors.neutral.gray400]
              }
              style={styles.registerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.neutral.white} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  roleBadgeText: {
    ...typography.textStyles.label,
    fontWeight: '600',
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
  inputContainerError: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.light,
  },
  input: {
    flex: 1,
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  termsText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    height: layout.buttonLarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  loginLink: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '700',
  },
  fieldError: {
    ...typography.textStyles.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default RegisterScreen;
