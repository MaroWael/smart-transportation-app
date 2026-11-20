import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, fontFamily, spacing } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * 2026 Modern Action Button:
 * - 52px tall with radius 14
 * - primary: bold metro blue fill, on-primary text, subtle press scale
 * - secondary: soft accentSoft background (no outline!), primary text
 * - ghost: transparent fill, textSecondary
 * - destructive: error fill, onPrimary text
 * - inline loading indicator + disabled state clearly muted
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDestructive = variant === 'destructive';
  const isGhost = variant === 'ghost';
  const pressDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (pressDisabled) return theme.surfaceAlt;
    if (isPrimary) return theme.primary;
    if (isSecondary) return theme.accentSoft;
    if (isDestructive) return theme.error;
    if (isGhost) return pressed ? theme.surfaceAlt : 'transparent';
    return theme.surface;
  };

  const getTextColor = () => {
    if (pressDisabled) return theme.textSecondary;
    if (isPrimary || isDestructive) return theme.onPrimary;
    if (isSecondary) return theme.primary;
    if (isGhost) return theme.textSecondary;
    return theme.primary;
  };

  const a11yLabel =
    accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      disabled={pressDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: theme.radius.button,
          backgroundColor: getBackgroundColor(pressed),
          opacity: pressDisabled ? 0.45 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !pressDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.spinner}
          />
        )}
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: fontSize.body,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginEnd: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
