/**
 * Responsive Design Hook
 * Provides device-agnostic dimensions and adaptive styling for all screen sizes
 */

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DeviceSize = 'phone-small' | 'phone-medium' | 'phone-large' | 'tablet' | 'web';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveDimensions {
  // Screen dimensions
  width: number;
  height: number;
  
  // Device classification
  deviceSize: DeviceSize;
  orientation: Orientation;
  
  // Padding and spacing
  screenPadding: number;
  cardPadding: number;
  
  // Responsive sizes
  itemWidth: (columns: number, gap?: number) => number;
  gridGap: number;
  
  // Typography scale (1 = base, adjust based on screen size)
  fontScale: number;
  
  // Safe area insets
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Is tablet/large screen
  isTablet: boolean;
  isLargeScreen: boolean;
}

export const useResponsive = (): ResponsiveDimensions => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Determine device size based on width
  let deviceSize: DeviceSize;
  let isTablet = false;
  let isLargeScreen = false;
  
  // Better breakpoints for more devices including Moto phones
  if (width < 340) {
    deviceSize = 'phone-small'; // Small phones (320-339px)
  } else if (width < 380) {
    deviceSize = 'phone-medium'; // Medium phones (340-379px) - Moto G series
  } else if (width < 600) {
    deviceSize = 'phone-large'; // Large phones (380-599px)
  } else if (width < 900) {
    deviceSize = 'tablet'; // Small tablets
    isTablet = true;
    isLargeScreen = true;
  } else {
    deviceSize = 'web'; // Large tablets/desktop
    isTablet = true;
    isLargeScreen = true;
  }
  
  // Determine orientation
  const orientation = height > width ? 'portrait' : 'landscape';
  
  // Calculate responsive spacing with finer control
  const screenPadding = width < 340 ? 10 : width < 360 ? 12 : width < 380 ? 14 : width < 430 ? 16 : width < 600 ? 18 : 20;
  const cardPadding = width < 340 ? 10 : width < 360 ? 12 : width < 430 ? 14 : width < 600 ? 16 : 18;
  const gridGap = width < 340 ? 6 : width < 360 ? 8 : width < 430 ? 10 : width < 600 ? 12 : 16;
  
  // Calculate font scale
  let fontScale = 1;
  if (width < 340) {
    fontScale = 0.85; // Smaller phones
  } else if (width < 360) {
    fontScale = 0.9; // Small phones
  } else if (width < 380) {
    fontScale = 0.95; // Medium phones (Moto G series)
  } else if (width > 800) {
    fontScale = 1.1; // Tablets and larger
  }
  
  // Function to calculate item width for grid layouts
  const itemWidth = (columns: number, gap: number = gridGap): number => {
    const availableWidth = width - (screenPadding * 2) - (gap * (columns - 1));
    return availableWidth / columns;
  };
  
  return {
    width,
    height,
    deviceSize,
    orientation,
    screenPadding,
    cardPadding,
    itemWidth,
    gridGap,
    fontScale,
    insets,
    isTablet,
    isLargeScreen,
  };
};

/**
 * Helper function to get adaptive font size
 */
export const adaptiveFontSize = (baseSize: number, scale: number): number => {
  return Math.round(baseSize * scale);
};

/**
 * Helper function to get adaptive spacing
 */
export const adaptiveSpacing = (baseSpacing: number, width: number): number => {
  if (width < 340) {
    return Math.round(baseSpacing * 0.7); // Very small phones
  } else if (width < 360) {
    return Math.round(baseSpacing * 0.8); // Small phones
  } else if (width < 380) {
    return Math.round(baseSpacing * 0.9); // Medium phones (Moto)
  } else if (width > 600) {
    return Math.round(baseSpacing * 1.2); // Tablets
  }
  return baseSpacing;
};

/**
 * Helper to get adaptive padding based on screen size
 */
export const getAdaptivePadding = (width: number) => ({
  xs: width < 340 ? 4 : width < 360 ? 6 : 8,
  sm: width < 340 ? 6 : width < 360 ? 8 : width < 380 ? 10 : 12,
  md: width < 340 ? 10 : width < 360 ? 12 : width < 380 ? 14 : 16,
  lg: width < 340 ? 14 : width < 360 ? 16 : width < 380 ? 18 : 20,
  xl: width < 340 ? 18 : width < 360 ? 20 : width < 380 ? 22 : 24,
});

/**
 * Helper to create responsive container styles
 */
export const createResponsiveContainer = (
  baseStyles: any,
  dimensions: ResponsiveDimensions
): any => {
  return {
    ...baseStyles,
    paddingHorizontal: dimensions.screenPadding,
    paddingVertical: dimensions.screenPadding * 0.75,
  };
};
