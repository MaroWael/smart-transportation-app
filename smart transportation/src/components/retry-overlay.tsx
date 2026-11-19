import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
import { Wordmark } from '@/components/ui/wordmark';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/context/auth-context';

export function RetryOverlay() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { refreshUser } = useAuth();

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <Wordmark />
      <ErrorIcon />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t('errors.offline')}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t('errors.networkError')}</Text>
      <Button onPress={refreshUser} style={styles.button}>
        {t('common.tryAgain')}
      </Button>
    </View>
  );
}

function ErrorIcon() {
  const theme = useTheme();

  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconOuter, { borderColor: theme.error }]} />
      <View style={[styles.iconBar, { backgroundColor: theme.error }]} />
      <View style={[styles.iconDot, { backgroundColor: theme.error }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  iconOuter: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderRadius: 26,
  },
  iconBar: {
    width: 2,
    height: 20,
    position: 'absolute',
    top: 14,
    left: 25,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 36,
    left: 22,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 600,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  button: {
    width: 200,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
});
