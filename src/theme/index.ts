/**
 * Solar Energy Sharing Platform - Theme Export
 * Unified theme object for the entire application
 */

import colors, { gradients, semanticColors, batteryColors } from './colors';
import typography, { textStyles, fontFamilies, fontSizes, fontWeights } from './typography';
import { spacing, borderRadius, shadows, layout, zIndex } from './spacing';

// Light theme
export const lightTheme = {
  dark: false,
  colors: {
    ...colors,
    background: colors.background.primary,
    surface: colors.background.secondary,
    surfaceElevated: colors.white,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    border: colors.border.light,
  },
};

// Dark theme
export const darkTheme = {
  dark: true,
  colors: {
    ...colors,
    background: colors.backgroundDark.primary,
    surface: colors.backgroundDark.secondary,
    surfaceElevated: colors.backgroundDark.elevated,
    text: colors.text.inverse,
    textSecondary: colors.text.disabled,
    border: colors.border.dark,
  },
};

// Complete theme object
const theme = {
  colors,
  gradients,
  semanticColors,
  batteryColors,
  typography,
  textStyles,
  fontFamilies,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  shadows,
  layout,
  zIndex,
  lightTheme,
  darkTheme,
};

export {
  colors,
  gradients,
  semanticColors,
  batteryColors,
  typography,
  textStyles,
  fontFamilies,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  shadows,
  layout,
  zIndex,
};

export default theme;
