import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { BrandHeader } from '@/components/ui/brand-header';
import { useAuth } from '@/context/auth-context';

/**
 * 2026 Modern Offline / Retry Overlay:
 * Soft tinted circle with error glyph, clear typography hierarchy, and primary retry button.
 */
export function RetryOverlay() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { refreshUser } = useAuth();

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <BrandHeader style={styles.brandHeader} />

      <View
        style={[
          styles.errorCircle,
          { backgroundColor: theme.accentSoft },
        ]}
      >
        <Ionicons name="cloud-offline-outline" size={32} color={theme.error} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('errors.offline')}
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {t('errors.networkError')}
      </Text>

      <Button onPress={refreshUser} style={styles.button}>
        {t('common.tryAgain')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  brandHeader: {
    position: 'absolute',
    top: 60,
  },
  errorCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: fontSize.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  button: {
    width: 220,
  },
});
