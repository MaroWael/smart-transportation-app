import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Wordmark } from '@/components/ui/wordmark';
import { spacing } from '@/constants/theme';

export type BrandHeaderProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * 2026 Compact Brand Header: Wordmark paired with a geometric metro-line
 * transit mark (track with 3 station nodes) in brand accent.
 */
export function BrandHeader({ style }: BrandHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Wordmark />
      <View style={styles.trackContainer}>
        {/* Horizontal transit track line */}
        <View style={[styles.trackLine, { backgroundColor: theme.primary }]} />
        {/* 3 metro station nodes */}
        <View style={[styles.node, { backgroundColor: theme.primary }]} />
        <View style={[styles.node, { backgroundColor: theme.primary }]} />
        <View style={[styles.node, { backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 44,
    height: 12,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 2.5,
    borderRadius: 1.5,
  },
  node: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    zIndex: 1,
  },
});
