/**
 * Solar Energy Sharing Platform - Typography System
 * Based on Inter font family with SF Mono for numbers
 */

import { Platform } from 'react-native';

// Font families
export const fontFamilies = {
  // Primary font for body text
  primary: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  // Monospace for numbers and metrics
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

// Font weights
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Font sizes
export const fontSizes = {
  // Display - Hero numbers
  display: 56,

  // Headings
  h1: 32,
  h2: 24,
  h3: 20,

  // Body text
  bodyLarge: 18,
  body: 16,
  bodySmall: 14,

  // Captions and labels
  caption: 12,
  overline: 11,

  // Tiny text
  tiny: 10,
};

// Line heights
export const lineHeights = {
  display: 64,
  h1: 40,
  h2: 32,
  h3: 28,
  bodyLarge: 28,
  body: 24,
  bodySmall: 20,
  caption: 16,
  overline: 16,
  tiny: 14,
};

// Letter spacing
export const letterSpacing = {
  tight: -1,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 1.5,
};

// Pre-defined text styles
export const textStyles = {
  // Display - For hero metrics (e.g., "4.5 kWh")
  display: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.extraBold,
    lineHeight: lineHeights.display,
    letterSpacing: letterSpacing.tight,
  },

  // H1 - Page titles
  h1: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.h1,
    letterSpacing: letterSpacing.normal,
  },

  // H2 - Section headers
  h2: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.h2,
    letterSpacing: letterSpacing.normal,
  },

  // H3 - Subsections
  h3: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.h3,
    letterSpacing: letterSpacing.normal,
  },

  // Body Large - Important paragraphs
  bodyLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.bodyLarge,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.bodyLarge,
    letterSpacing: letterSpacing.normal,
  },

  // Body - Default text
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },

  // Body Small - Secondary text
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.bodySmall,
    letterSpacing: letterSpacing.normal,
  },

  // Body Medium - Medium weight body text
  bodyMedium: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },

  // Caption - Labels, hints
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.caption,
    letterSpacing: letterSpacing.wide,
  },

  // Overline - All caps labels
  overline: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.overline,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.overline,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },

  // Metric Large - For card values (e.g., "₹125.50")
  metricLarge: {
    fontFamily: fontFamilies.mono,
    fontSize: 32,
    fontWeight: fontWeights.bold,
    lineHeight: 40,
    letterSpacing: letterSpacing.normal,
  },

  // Metric Medium - Inline numbers
  metricMedium: {
    fontFamily: fontFamilies.mono,
    fontSize: 24,
    fontWeight: fontWeights.semiBold,
    lineHeight: 32,
    letterSpacing: letterSpacing.normal,
  },

  // Metric Small - Small numbers
  metricSmall: {
    fontFamily: fontFamilies.mono,
    fontSize: 18,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    letterSpacing: letterSpacing.normal,
  },

  // Button text
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.wide,
  },

  // Button small
  buttonSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.bodySmall,
    letterSpacing: letterSpacing.wide,
  },

  // Button large
  buttonLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.bodyLarge,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.bodyLarge,
    letterSpacing: letterSpacing.wide,
  },

  // Label - Form labels and tags
  label: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.bodySmall,
    letterSpacing: letterSpacing.normal,
  },

  // Button medium
  buttonMedium: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.wide,
  },

  // Tiny text - smallest text
  tiny: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.tiny,
    letterSpacing: letterSpacing.normal,
  },

  // Link text
  link: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
};

export default {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  textStyles,
};
