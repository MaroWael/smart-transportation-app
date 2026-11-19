import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, radius } from '@/constants/theme';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Modern button, 52px high.
 * - primary: solid primary blue fill, on-primary text.
 * - secondary: surface fill, 1px border, primary text.
 * - ghost: transparent fill, secondary text (for subtle actions).
 * Labels (including loading state) are passed in translated by the caller.
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const pressDisabled = disabled || loading;

  const base: ViewStyle = {
    height: 52,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  };

  let containerStyle: ViewStyle;
  if (pressDisabled) {
    containerStyle = {
      ...base,
      opacity: 0.5,
      backgroundColor: theme.surfaceAlt,
    };
  } else if (isPrimary) {
    containerStyle = { ...base, backgroundColor: theme.primary };
  } else if (isGhost) {
    containerStyle = { ...base, backgroundColor: 'transparent' };
  } else {
    containerStyle = {
      ...base,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    };
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      disabled={pressDisabled}
      onPress={onPress}
      style={[containerStyle, style]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isPrimary ? theme.onPrimary : isGhost ? theme.textSecondary : theme.primary,
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSize.md,
    fontWeight: 600,
  },
});
