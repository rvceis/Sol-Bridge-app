import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    icon: 'sunny',
    title: 'Welcome to Solar Sharing',
    description: 'Join the renewable energy revolution. Buy, sell, and trade solar energy with people in your community.',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
  {
    id: 'role',
    icon: 'people',
    title: 'Choose Your Role',
    description: 'Are you a buyer looking for green energy, a seller with solar panels, or an investor funding installations?',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    options: [
      { key: 'buyer', label: 'Buyer', icon: 'cart', desc: 'Buy renewable energy' },
      { key: 'seller', label: 'Seller', icon: 'flash', desc: 'Sell your solar energy' },
      { key: 'investor', label: 'Investor', icon: 'trending-up', desc: 'Fund solar installations' },
      { key: 'hoster', label: 'Hoster', icon: 'home', desc: 'Host solar panels' },
    ],
  },
  {
    id: 'devices',
    icon: 'hardware-chip',
    title: 'Add Your Devices',
    description: 'Register your solar panels, batteries, or smart meters to start trading energy.',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    action: 'Add Device',
    actionScreen: 'DeviceManagement',
  },
  {
    id: 'payment',
    icon: 'card',
    title: 'Setup Payment',
    description: 'Add a payment method to buy energy or receive payments for selling.',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    action: 'Add Payment Method',
    actionScreen: 'PaymentMethods',
  },
  {
    id: 'kyc',
    icon: 'shield-checkmark',
    title: 'Verify Identity',
    description: 'Complete KYC verification to unlock all features and build trust with other users.',
    color: '#F44336',
    bgColor: '#FFEBEE',
    action: 'Start Verification',
    actionScreen: 'Documents',
  },
  {
    id: 'location',
    icon: 'location',
    title: 'Enable Location',
    description: 'Allow location access to find nearby sellers, optimize energy delivery, and reduce costs.',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    action: 'Enable Location',
    requiresPermission: true,
  },
  {
    id: 'ready',
    icon: 'checkmark-circle',
    title: 'You\'re All Set!',
    description: 'Start exploring the marketplace, find nearby sellers, or list your energy for sale.',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>('buyer');

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      // Complete onboarding
      onComplete?.();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  const handleAction = () => {
    if (step.actionScreen) {
      navigation.navigate(step.actionScreen as never);
    }
  };

  const renderRoleOptions = () => (
    <View style={styles.optionsContainer}>
      {step.options?.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.roleOption,
            selectedRole === option.key && styles.roleOptionActive,
          ]}
          onPress={() => setSelectedRole(option.key)}
        >
          <View style={[
            styles.roleIconContainer,
            selectedRole === option.key && { backgroundColor: step.color + '20' },
          ]}>
            <Ionicons
              name={option.icon as any}
              size={28}
              color={selectedRole === option.key ? step.color : '#999'}
            />
          </View>
          <Text style={[
            styles.roleLabel,
            selectedRole === option.key && { color: step.color },
          ]}>
            {option.label}
          </Text>
          <Text style={styles.roleDesc}>{option.desc}</Text>
          {selectedRole === option.key && (
            <View style={[styles.roleCheck, { backgroundColor: step.color }]}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {ONBOARDING_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Skip Button */}
      {!isLastStep && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: step.bgColor }]}>
          <Ionicons name={step.icon as any} size={64} color={step.color} />
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {/* Role Selection */}
        {step.id === 'role' && renderRoleOptions()}

        {/* Action Button */}
        {step.action && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: step.color + '15' }]}
            onPress={handleAction}
          >
            <Ionicons name="add-circle" size={20} color={step.color} />
            <Text style={[styles.actionButtonText, { color: step.color }]}>
              {step.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navContainer}>
        {!isFirstStep && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: step.color }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={isLastStep ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#007AFF',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  roleOption: {
    width: (width - 80) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  roleOptionActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
