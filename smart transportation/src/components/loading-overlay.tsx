import React from 'react';
import { StyleSheet, View } from 'react-native';

import { TransitLoadingScreen } from '@/components/transit-loading-screen';

/**
 * Full-screen absolute loading overlay so underlying routes never
 * squish or flash during font loading or session restoration.
 */
export function LoadingOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <TransitLoadingScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});
