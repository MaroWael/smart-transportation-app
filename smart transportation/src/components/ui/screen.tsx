import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/theme';

export type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
};

/**
 * 2026 Modern Screen Container:
 * - Safe area wrapper with warm off-white background
 * - 24px horizontal screen padding
 * - Smooth mount fade/slide transition that clears native transforms upon completion
 *   to ensure Android input methods (IME) and keyboards remain 100% lag-free
 * - Fully respects reduced-motion accessibility settings
 * - Max content width 480px on web, full-width on mobile
 */
export function Screen({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
}: ScreenProps) {
  const theme = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(12));
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!isMounted) return;
        if (enabled) {
          fadeAnim.setValue(1);
          slideAnim.setValue(0);
          setAnimDone(true);
        } else {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isMounted) {
              setAnimDone(true);
            }
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isMounted) {
            setAnimDone(true);
          }
        });
      });

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, slideAnim]);

  // Strip native transform once mount animation finishes so Android TextInput IME
  // coordinates are never displaced or lagged by an active matrix transform
  const animatedStyle = animDone
    ? styles.animatedContent
    : [
        styles.animatedContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ];

  const innerContent = (
    <Animated.View style={animatedStyle}>
      <View style={styles.center}>
        <View style={styles.maxWidthContainer}>{children}</View>
      </View>
    </Animated.View>
  );

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
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardAvoiding}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {innerContent}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.staticContainer,
              { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
              contentContainerStyle,
            ]}
          >
            {innerContent}
          </View>
        )}
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
  staticContainer: {
    flex: 1,
  },
  animatedContent: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  maxWidthContainer: {
    width: '100%',
    maxWidth: 480,
  },
});
