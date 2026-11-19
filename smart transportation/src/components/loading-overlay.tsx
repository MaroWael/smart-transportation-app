import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Wordmark } from '@/components/ui/wordmark';

/**
 * Splash / loading overlay: just the wordmark centered in primary blue on the
 * background color, nothing else.
 */
export function LoadingOverlay() {
  const theme = useTheme();

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <Wordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
