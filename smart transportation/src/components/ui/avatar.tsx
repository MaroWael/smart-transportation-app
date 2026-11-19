import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type AvatarProps = {
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * 2026 Modern Initials Avatar: soft tinted circular surface with bold primary initials.
 */
export function Avatar({ name, size = 64, style }: AvatarProps) {
  const theme = useTheme();
  const initials = getInitials(name);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} avatar` : 'User avatar'}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentSoft,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.primary,
            fontSize: size * 0.38,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
