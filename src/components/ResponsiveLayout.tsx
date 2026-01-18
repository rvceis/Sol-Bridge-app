/**
 * Responsive Layout Wrapper Component
 * Automatically handles layout adjustments for different screen sizes
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  flex?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  padded = true,
  flex = true,
}) => {
  const responsive = useResponsive();

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: padded ? responsive.screenPadding : 0,
      flex: flex ? 1 : undefined,
    },
  });

  return <View style={[styles.container, style]}>{children}</View>;
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 2,
  gap,
  style,
}) => {
  const responsive = useResponsive();

  // Adjust columns based on device size
  let effectiveColumns = columns;
  if (responsive.isTablet) {
    effectiveColumns = Math.min(columns + 1, 4);
  }
  if (responsive.deviceSize === 'phone-small') {
    effectiveColumns = 1;
  }

  const itemGap = gap ?? responsive.gridGap;

  const styles = StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: itemGap,
      marginHorizontal: -itemGap / 2,
    },
  });

  return <View style={[styles.grid, style]}>{children}</View>;
};

interface ResponsiveGridItemProps {
  children: React.ReactNode;
  columns?: number;
  style?: ViewStyle;
}

export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  columns = 2,
  style,
}) => {
  const responsive = useResponsive();

  // Adjust columns based on device size
  let effectiveColumns = columns;
  if (responsive.isTablet) {
    effectiveColumns = Math.min(columns + 1, 4);
  }
  if (responsive.deviceSize === 'phone-small') {
    effectiveColumns = 1;
  }

  const itemWidth = responsive.itemWidth(effectiveColumns);

  const styles = StyleSheet.create({
    item: {
      width: itemWidth,
    },
  });

  return <View style={[styles.item, style]}>{children}</View>;
};

interface ResponsiveSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({ size = 'md' }) => {
  const responsive = useResponsive();

  const sizeMap = {
    xs: responsive.screenPadding * 0.5,
    sm: responsive.screenPadding * 0.75,
    md: responsive.screenPadding,
    lg: responsive.screenPadding * 1.5,
    xl: responsive.screenPadding * 2,
  };

  return <View style={{ height: sizeMap[size] }} />;
};
