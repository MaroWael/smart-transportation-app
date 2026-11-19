import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/theme';

export type ScreenProps = {
  children: React.ReactNode;
  style?: ViewProps['style'];
  contentContainerStyle?: ViewProps['style'];
};

/**
 * Modern screen scaffold: safe area, KeyboardAvoidingView + ScrollView,
 * horizontal padding on an 8pt grid, and content centered with a max width
 * of 480px on web (full width on mobile).
 */
export function Screen({ children, style, contentContainerStyle }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
        style,
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: spacing.lg },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.center}>
            <View style={[styles.content, { maxWidth: 480 }]}>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  center: {
    alignItems: 'flex-start',
    width: '100%',
  },
  content: {
    width: '100%',
  },
});
