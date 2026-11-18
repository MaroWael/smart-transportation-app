import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

import { useAuth } from '@/context/auth-context';

export function RetryOverlay() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();

  return (
    <ThemedView type="background" style={styles.overlay}>
      <ThemedText type="subtitle" style={styles.message}>
        {t('errors.networkError')}
      </ThemedText>
      <Pressable style={styles.button} onPress={refreshUser}>
        <ThemedText type="smallBold">{t('common.tryAgain')}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  message: {
    textAlign: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
