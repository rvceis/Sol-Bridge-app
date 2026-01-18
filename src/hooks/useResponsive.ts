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
  
  if (width < 360) {
    deviceSize = 'phone-small';
  } else if (width < 430) {
    deviceSize = 'phone-medium';
  } else if (width < 600) {
    deviceSize = 'phone-large';
  } else if (width < 900) {
    deviceSize = 'tablet';
    isTablet = true;
    isLargeScreen = true;
  } else {
    deviceSize = 'web';
    isTablet = true;
    isLargeScreen = true;
  }
  
  // Determine orientation
  const orientation = height > width ? 'portrait' : 'landscape';
  
  // Calculate responsive spacing
  const baseSpacing = 16;
  const screenPadding = width < 360 ? 12 : width < 430 ? 16 : 20;
  const cardPadding = width < 360 ? 12 : width < 430 ? 14 : 16;
  const gridGap = width < 360 ? 8 : width < 430 ? 12 : 16;
  
  // Calculate font scale
  let fontScale = 1;
  if (width < 360) {
    fontScale = 0.9;
  } else if (width > 800) {
    fontScale = 1.1;
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
  if (width < 360) {
    return Math.round(baseSpacing * 0.8);
  } else if (width > 600) {
    return Math.round(baseSpacing * 1.2);
  }
  return baseSpacing;
};

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
