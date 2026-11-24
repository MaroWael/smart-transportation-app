import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { fontFamily } from '@/constants/theme';

type TransitLoadingScreenProps = {
  isStaff?: boolean;
  userName?: string;
};

export function TransitLoadingScreen({
  isStaff = false,
  userName,
}: TransitLoadingScreenProps) {
  const theme = useTheme();

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const emblemScale = useRef(new Animated.Value(0.94)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(emblemScale, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emblemScale, {
          toValue: 0.96,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const createDotWave = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(360),
        ])
      );

    const anims = [
      createPulse(pulse1, 0),
      createPulse(pulse2, 900),
      breathe,
      createDotWave(dot1, 0),
      createDotWave(dot2, 160),
      createDotWave(dot3, 320),
    ];

    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [pulse1, pulse2, emblemScale, dot1, dot2, dot3]);

  const firstName = userName?.trim()?.split(/\s+/)?.[0];

  const renderRing = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 2.05],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 0.35, 0],
    }),
  });

  const renderDot = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    }),
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centerBlock}>
        {/* Animated Concentric Pulse Rings + Emblem */}
        <View style={styles.emblemStage}>
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: theme.primary },
              renderRing(pulse1),
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: theme.primary },
              renderRing(pulse2),
            ]}
          />
          <Animated.View
            style={[
              styles.emblemCircle,
              {
                backgroundColor: theme.primary,
                transform: [{ scale: emblemScale }],
              },
            ]}
          >
            <Ionicons
              name={isStaff ? 'qr-code' : 'subway'}
              size={34}
              color="#FFFFFF"
            />
          </Animated.View>
        </View>

        {/* Role Pill */}
        <View style={styles.brandPill}>
          <Text style={[styles.brandPillText, { color: theme.primary }]}>
            {isStaff ? 'STATION STAFF PORTAL' : 'SMART TRANSIT'}
          </Text>
        </View>

        {/* Greeting & Status */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {firstName ? `Welcome, ${firstName}` : 'Getting things ready'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {isStaff
            ? 'Loading gate scanner & recent validations...'
            : 'Loading your tickets & Cairo transit network...'}
        </Text>

        {/* Animated 3-Dot Wave */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                { backgroundColor: theme.primary },
                renderDot(dot),
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerBlock: {
    alignItems: 'center',
    width: '100%',
  },
  emblemStage: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
  },
  emblemCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B4F8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  brandPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  brandPillText: {
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
