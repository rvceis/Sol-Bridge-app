/**
 * Solar Energy Sharing Platform - Onboarding Screen
 * 3-step animated onboarding experience
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
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
import { useAuthStore } from '../../store';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly string[] | string[];
  iconColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Solar Power',
    subtitle: 'Harness the Sun',
    description:
      'Transform sunlight into savings. Share your excess solar energy with your community and earn while you power others.',
    icon: 'sunny',
    gradient: gradients.solarSunrise.colors,
    iconColor: colors.primary.main,
  },
  {
    id: '2',
    title: 'Community Energy',
    subtitle: 'Connect & Share',
    description:
      'Join a network of energy producers and consumers. Buy clean energy directly from your neighbors at competitive rates.',
    icon: 'people',
    gradient: gradients.electricFlow.colors,
    iconColor: colors.secondary.main,
  },
  {
    id: '3',
    title: 'Smart Earnings',
    subtitle: 'Grow Together',
    description:
      'Track your production, monitor consumption, and watch your earnings grow. Real-time insights at your fingertips.',
    icon: 'trending-up',
    gradient: gradients.energySpectrum.colors,
    iconColor: colors.success.main,
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleGetStarted();
  };

  const handleGetStarted = () => {
    setOnboarded(true);
    navigation.navigate('RoleSelection');
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        {/* Background Gradient */}
        <LinearGradient
          colors={item.gradient as [string, string, ...string[]]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale }, { translateY }],
              opacity,
            },
          ]}
        >
          {/* Icon Container */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[colors.white, colors.background.secondary] as [string, string]}
              style={styles.iconCircle}
            >
              <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </LinearGradient>

            {/* Animated rings */}
            <Animated.View
              style={[
                styles.ring,
                styles.ring1,
                { borderColor: item.iconColor + '30' },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring2,
                { borderColor: item.iconColor + '20' },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring3,
                { borderColor: item.iconColor + '10' },
              ]}
            />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: [
              colors.neutral.gray400,
              colors.primary.main,
              colors.neutral.gray400,
            ],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: dotColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Pagination */}
        {renderPagination()}

        {/* Next / Get Started Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {currentIndex === slides.length - 1 ? (
              <Text style={styles.nextButtonText}>Get Started</Text>
            ) : (
              <Ionicons name="arrow-forward" size={24} color={colors.neutral.white} />
            )}
          </LinearGradient>
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
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 150,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 500,
  },
  ring1: {
    width: 200,
    height: 200,
  },
  ring2: {
    width: 240,
    height: 240,
  },
  ring3: {
    width: 280,
    height: 280,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.textStyles.label,
    color: colors.neutral.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    ...typography.textStyles.display,
    color: colors.neutral.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.textStyles.body,
    color: colors.neutral.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  nextButtonGradient: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...typography.textStyles.buttonLarge,
    color: colors.neutral.white,
  },
});

export default OnboardingScreen;
