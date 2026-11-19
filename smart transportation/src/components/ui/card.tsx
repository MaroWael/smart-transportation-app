import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type AccessibilityRole,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/theme';

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'tinted';
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  disabled?: boolean;
};

/**
 * 2026 Modern Card: white surface with radius 20, soft low-opacity shadow,
 * clean internal padding on 8pt grid, and optional press feedback.
 */
export function Card({
  children,
  style,
  contentStyle,
  onPress,
  variant = 'default',
  accessibilityLabel,
  accessibilityRole,
  disabled = false,
}: CardProps) {
  const theme = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'tinted':
        return theme.accentSoft;
      case 'elevated':
        return theme.surfaceElevated;
      default:
        return theme.surface;
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: theme.radius.card,
    ...theme.elevation.card,
    overflow: 'hidden',
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole ?? 'button'}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          containerStyle,
          {
            opacity: disabled ? 0.6 : 1,
            transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
          },
          style,
        ]}
      >
        <View style={[styles.innerContent, contentStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.base, containerStyle, style]}
    >
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
  innerContent: {
    padding: spacing.md,
  },
});
