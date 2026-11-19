import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { fontSize } from '@/constants/theme';

export type WordmarkProps = {
  style?: Parameters<typeof Text>[0]['style'];
};

/**
 * 2026 App Wordmark: t('common.appName') in bold brand primary with tight letter-spacing.
 */
export function Wordmark({ style }: WordmarkProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.wordmark,
        { color: theme.primary, fontSize: fontSize.title },
        style,
      ]}
    >
      {t('common.appName')}
    </Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontWeight: '700',
    letterSpacing: -0.6,
  },
});
