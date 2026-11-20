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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, fontFamily, spacing } from '@/constants/theme';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

/**
 * 2026 Modern Screen Header with Back Navigation:
 * - Touch target >= 48x48 on back button
 * - Clean typography hierarchy using Inter SemiBold
 * - RTL-safe logical margin and padding
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  trailing,
  style,
  titleStyle,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? theme.surfaceAlt : theme.surface,
                borderRadius: theme.radius.full,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
        ) : null}

        <View style={styles.titleWrapper}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: theme.textPrimary },
              titleStyle,
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {trailing ? <View style={styles.trailingWrapper}>{trailing}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.title,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  trailingWrapper: {
    marginStart: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
