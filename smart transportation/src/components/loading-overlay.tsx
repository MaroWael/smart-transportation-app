import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function LoadingOverlay() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView type="background" style={styles.overlay}>
      <ActivityIndicator size="large" color={theme.textSecondary} />
      <ThemedText type="subtitle">{t('common.loading')}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
