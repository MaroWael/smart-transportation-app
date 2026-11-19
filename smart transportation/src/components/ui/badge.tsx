import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';

export type BadgeVariant = 'accent' | 'neutral' | 'success' | 'error';

export type BadgeProps = {
  label: string;
  icon?: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * 2026 Modern Pill / Chip: fully rounded, soft tinted background,
 * subtle typography and touch target support.
 */
export function Badge({
  label,
  icon,
  variant = 'accent',
  size = 'md',
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: BadgeProps) {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'neutral':
        return {
          bg: theme.surfaceAlt,
          text: theme.textSecondary,
        };
      case 'success':
        return {
          bg: theme.accentSoft,
          text: theme.success,
        };
      case 'error':
        return {
          bg: theme.accentSoft,
          text: theme.error,
        };
      case 'accent':
      default:
        return {
          bg: theme.accentSoft,
          text: theme.primary,
        };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  const badgeContent = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.bg,
          borderRadius: theme.radius.full,
          paddingVertical: isSm ? spacing.xs : spacing.sm,
          paddingHorizontal: isSm ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSm ? fontSize.xs : fontSize.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.touchable,
          {
            opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
            transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
          },
        ]}
      >
        {badgeContent}
      </Pressable>
    );
  }

  return badgeContent;
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginEnd: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
