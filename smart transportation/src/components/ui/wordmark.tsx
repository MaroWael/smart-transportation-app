import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { fontSize } from '@/constants/theme';

export type WordmarkProps = {
  style?: Parameters<typeof Text>[0]['style'];
};

/**
 * App wordmark: t('common.appName') in primary blue, semibold 20.
 */
export function Wordmark({ style }: WordmarkProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.wordmark,
        { color: theme.primary, fontSize: fontSize.lg, fontWeight: 600 },
        style,
      ]}
    >
      {t('common.appName')}
    </Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    letterSpacing: -0.5,
  },
});
