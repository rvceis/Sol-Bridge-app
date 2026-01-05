/**
 * Solar Energy Sharing Platform - Color System
 * Based on "Energy in Motion" design philosophy
 */

// Primary Colors
export const colors = {
  // Solar Gold (Primary) - Solar energy, generation, positive metrics
  primary: {
    main: '#FDB813',
    light: '#FFDB5C',
    dark: '#E5A300',
    ultraLight: '#FFF4D6',
  },

  // Electric Blue (Secondary) - Consumption, interactive elements
  secondary: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    ultraLight: '#E3F2FD',
  },

  // Energy Green (Success) - Savings, battery, environment
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    ultraLight: '#E8F5E9',
  },

  // Grid Gray (Neutral) - Grid electricity, disabled states
  neutral: {
    main: '#607D8B',
    light: '#90A4AE',
    dark: '#455A64',
    ultraLight: '#ECEFF1',
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },

  // Info Blue - For informational states
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    ultraLight: '#E3F2FD',
  },

  // Warning Amber - Alerts, low battery, peak pricing
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    ultraLight: '#FFF3E0',
  },

  // Error Red - Critical errors, failed transactions
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    ultraLight: '#FFEBEE',
  },

  // Carbon Black - Text, headers
  text: {
    primary: '#212121',
    secondary: '#424242',
    tertiary: '#757575',
    disabled: '#9E9E9E',
    placeholder: '#BDBDBD',
    hint: '#BDBDBD',
    inverse: '#FFFFFF',
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#FFF4D6',
  },

  // Dark Mode Backgrounds
  backgroundDark: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2C2C2C',
    elevated: '#2D2D2D',
  },

  // Borders & Dividers
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#424242',
  },

  // Transparent overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(0, 0, 0, 0.5)',
    primary: 'rgba(253, 184, 19, 0.1)',
  },

  // Pure values
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Gradient definitions
export const gradients = {
  // Solar Sunrise - Primary gradient for hero sections, CTAs
  solarSunrise: {
    colors: ['#FF6B35', '#FDB813', '#FFE66D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Electric Flow - Consumption visualizations
  electricFlow: {
    colors: ['#2196F3', '#1E88E5', '#1565C0'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Energy Spectrum - Battery level, intensity gauges
  energySpectrum: {
    colors: ['#4CAF50', '#FDB813', '#FF9800', '#F44336'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Card Glow - Subtle card backgrounds
  cardGlow: {
    colors: ['rgba(253, 184, 19, 0.15)', 'rgba(253, 184, 19, 0)'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },

  // Dark mode gradient
  darkSurface: {
    colors: ['#1E1E1E', '#121212'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

// Semantic color mappings
export const semanticColors = {
  // Energy types
  solarEnergy: colors.primary.main,
  gridEnergy: colors.neutral.main,
  batteryEnergy: colors.success.main,

  // Financial
  earnings: colors.success.main,
  spending: colors.error.main,
  savings: colors.success.light,

  // Status
  online: colors.success.main,
  offline: colors.neutral.main,
  warning: colors.warning.main,
  error: colors.error.main,

  // Trends
  trendUp: colors.success.main,
  trendDown: colors.error.main,
  trendNeutral: colors.neutral.main,
};

// Battery level colors
export const batteryColors = {
  critical: colors.error.main, // 0-20%
  low: colors.warning.main, // 20-40%
  medium: colors.primary.main, // 40-60%
  good: colors.success.light, // 60-80%
  full: colors.success.main, // 80-100%
};

export default colors;
