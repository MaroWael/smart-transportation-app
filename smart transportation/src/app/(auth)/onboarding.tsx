import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { fontFamily, spacing } from '@/constants/theme';
import { storage } from '@/lib/storage';

type Slide = {
  key: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentBg: string;
  accentColor: string;
  chips: { label: string; color: string }[];
};

const SLIDES: Slide[] = [
  {
    key: 'network',
    badge: 'SMART TRANSIT',
    title: 'Plan Smarter\nAcross Cairo',
    subtitle:
      'Explore Cairo Metro Lines 1–3, interchanges, and bus routes with instant fare & route calculation.',
    icon: 'subway',
    accentBg: '#E0F2FE',
    accentColor: '#0B4F8A',
    chips: [
      { label: 'Line 1', color: '#D32F2F' },
      { label: 'Line 2', color: '#1976D2' },
      { label: 'Line 3', color: '#2E7D32' },
      { label: 'Bus', color: '#0B4F8A' },
    ],
  },
  {
    key: 'pass',
    badge: 'DIGITAL TICKETING',
    title: 'Pay in Seconds,\nBoard with QR',
    subtitle:
      'Complete secure in-app checkout and receive a tamper-proof digital QR boarding pass immediately.',
    icon: 'qr-code',
    accentBg: '#ECFDF5',
    accentColor: '#059669',
    chips: [
      { label: 'Instant Checkout', color: '#0B4F8A' },
      { label: 'Signed QR Pass', color: '#059669' },
    ],
  },
  {
    key: 'verify',
    badge: 'GATE OPERATIONS',
    title: 'Seamless Gate\nVerification',
    subtitle:
      'Built for both passengers and station staff with real-time QR scanning and single-use ticket protection.',
    icon: 'shield-checkmark',
    accentBg: '#EFF6FF',
    accentColor: '#1D4ED8',
    chips: [
      { label: 'Passenger App', color: '#0B4F8A' },
      { label: 'Staff Scanner', color: '#1D4ED8' },
    ],
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
      const idx = viewableItems[0]?.index;
      if (typeof idx === 'number') {
        setActiveIndex(idx);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const finishOnboarding = async () => {
    await storage.setOnboardingSeen(true);
    router.replace('/login' as any);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      void finishOnboarding();
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
    >
      {/* Top Bar: Brand + Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View
            style={[styles.brandMiniIcon, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="subway" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.brandName, { color: theme.textPrimary }]}>
            Smart Transit
          </Text>
        </View>

        {!isLast ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => void finishOnboarding()}
            style={({ pressed }) => [
              styles.skipBtn,
              pressed && { opacity: 0.65 },
            ]}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Swipeable Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Hero Visual Card */}
            <View
              style={[
                styles.heroVisual,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.outerHalo,
                  { backgroundColor: item.accentBg },
                ]}
              >
                <View
                  style={[
                    styles.innerCircle,
                    { backgroundColor: item.accentColor },
                  ]}
                >
                  <Ionicons name={item.icon} size={46} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.chipsRow}>
                {item.chips.map((chip) => (
                  <View
                    key={chip.label}
                    style={[styles.chip, { backgroundColor: chip.color }]}
                  >
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Copy */}
            <View style={styles.copyBlock}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {item.badge}
              </Text>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Footer: Pagination Dots + Primary CTA */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, idx) => {
            const active = idx === activeIndex;
            return (
              <View
                key={s.key}
                style={[
                  styles.dot,
                  {
                    width: active ? 26 : 8,
                    backgroundColor: active ? theme.primary : '#CBD5E1',
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.88 },
          ]}
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={isLast ? 'checkmark-circle' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMiniIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  skipPlaceholder: {
    width: 48,
    height: 28,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: 28,
  },
  heroVisual: {
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 38,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  outerHalo: {
    width: 144,
    height: 144,
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B4F8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
  },
  copyBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 35,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B4F8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
  },
});
