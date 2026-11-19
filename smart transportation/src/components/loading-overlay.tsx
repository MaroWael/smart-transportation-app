import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { BrandHeader } from '@/components/ui/brand-header';

/**
 * 2026 Modern Loading / Splash Overlay:
 * Clean brand header centered on the background with a gentle fade-in,
 * fully respecting reduced-motion accessibility.
 */
export function LoadingOverlay() {
  const theme = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, reduceMotion]);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <BrandHeader />
      </Animated.View>
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
