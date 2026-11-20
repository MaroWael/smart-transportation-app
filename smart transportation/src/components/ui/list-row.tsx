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
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, fontFamily, spacing } from '@/constants/theme';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * 2026 Modern Settings / Menu Row: minimum 52px height, logical margins,
 * clear hierarchy, trailing metadata or chevron.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  destructive = false,
  disabled = false,
  showChevron = true,
  style,
  titleStyle,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();

  const titleColor = destructive
    ? theme.error
    : disabled
      ? theme.textSecondary
      : theme.textPrimary;

  const content = (
    <View style={[styles.row, style]}>
      {leading ? <View style={styles.leadingContainer}>{leading}</View> : null}

      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: titleColor,
              fontSize: fontSize.body,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[
              styles.subtitle,
              {
                color: theme.textSecondary,
                fontSize: fontSize.caption,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.trailingContainer}>
        {trailing ? trailing : null}
        {onPress && showChevron && !trailing ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
            style={styles.chevron}
          />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          {
            backgroundColor: pressed && !disabled ? theme.surfaceAlt : 'transparent',
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.staticWrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: 14,
  },
  staticWrapper: {
    minHeight: 52,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  leadingContainer: {
    marginEnd: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  trailingContainer: {
    marginStart: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginStart: spacing.xs,
  },
});
