/**
 * Solar Energy Sharing Platform - Spacing & Layout System
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

// Spacing scale
export const spacing = {
  // Extra small (4px)
  xs: BASE_UNIT, // 4

  // Small (8px)
  sm: BASE_UNIT * 2, // 8

  // Medium (12px)
  md: BASE_UNIT * 3, // 12

  // Regular (16px)
  base: BASE_UNIT * 4, // 16

  // Large (20px)
  lg: BASE_UNIT * 5, // 20

  // Extra large (24px)
  xl: BASE_UNIT * 6, // 24

  // 2X large (32px)
  '2xl': BASE_UNIT * 8, // 32

  // 3X large (40px)
  '3xl': BASE_UNIT * 10, // 40

  // 4X large (48px)
  '4xl': BASE_UNIT * 12, // 48

  // 5X large (64px)
  '5xl': BASE_UNIT * 16, // 64
};

// Border radius
export const borderRadius = {
  // No radius
  none: 0,

  // Small (4px) - Buttons, inputs
  sm: 4,

  // Medium (8px) - Small cards
  md: 8,

  // Large (12px) - Inputs, small cards
  lg: 12,

  // Extra large (16px) - Cards
  xl: 16,

  // 2X large (20px) - Large cards
  '2xl': 20,

  // 3X large (24px) - Hero cards
  '3xl': 24,

  // 4X large (28px) - Pill buttons
  '4xl': 28,

  // Full (9999px) - Circular elements
  full: 9999,
};

// Shadow definitions
export const shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Small (Level 1)
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Medium (Level 2)
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // Large (Level 3)
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // Extra large (Level 4)
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  // Primary color shadow (for CTAs)
  primary: {
    shadowColor: '#FDB813',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },

  // Success color shadow
  success: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Layout dimensions
export const layout = {
  // Screen padding
  screenPadding: spacing.base,

  // Card padding
  cardPadding: spacing.xl,

  // Input height
  inputHeight: 56,

  // Button heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 56,
  },
  // Button height shortcuts
  buttonSmall: 36,
  buttonMedium: 44,
  buttonLarge: 56,

  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },

  // Avatar sizes
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },

  // Tab bar height
  tabBarHeight: 64,

  // Header height
  headerHeight: 56,

  // Bottom sheet handle
  bottomSheetHandle: {
    width: 40,
    height: 4,
  },
};

// Z-index levels
export const zIndex = {
  background: 0,
  content: 1,
  card: 10,
  sticky: 100,
  modal: 1000,
  toast: 2000,
  tooltip: 3000,
};

export default {
  spacing,
  borderRadius,
  shadows,
  layout,
  zIndex,
};
