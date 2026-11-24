import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Card, Badge, Avatar } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { BookingRecord, fetchMyBookings } from '@/lib/transport-api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecent = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchMyBookings(token);
      setRecentBookings(data.slice(0, 4));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
    } finally {
      setRefreshing(false);
    }
  }, [token, logout]);

  useFocusEffect(
    useCallback(() => {
      void loadRecent();
    }, [loadRecent])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecent();
  };

  const firstName = user?.fullName?.trim()?.split(/\s+/)?.[0] ?? '';
  const greeting = firstName
    ? t('home.greeting', { name: firstName })
    : t('home.greetingGuest');

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      {/* Top Bar: User Greeting + Avatar */}
      <View style={styles.topHeader}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>
            {greeting}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: theme.textSecondary }]}>
            {t('home.subtitle')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/(tabs)/profile' as any)}
        >
          <Avatar name={user?.fullName ?? user?.email ?? ''} size={44} />
        </Pressable>
      </View>

      {/* Prominent "Where to?" Journey Planner Card */}
      <View style={styles.searchSection}>
        <Card
          onPress={() => router.push('/journey' as any)}
          accessibilityLabel={t('home.whereTo')}
          style={styles.searchCard}
          contentStyle={styles.searchCardContent}
        >
          <View
            style={[
              styles.searchIconCircle,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons name="navigate" size={20} color={theme.primary} />
          </View>
          <View style={styles.searchTextWrapper}>
            <Text style={[styles.searchTitle, { color: theme.textPrimary }]}>
              {t('home.whereTo')}
            </Text>
            <Text
              style={[styles.searchPlaceholder, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {t('home.whereToPlaceholder')}
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-circle"
            size={26}
            color={theme.primary}
            style={styles.searchTrailing}
          />
        </Card>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('home.quickActions')}
        </Text>
        <View style={styles.quickActionsRow}>
          <Card
            variant="default"
            onPress={() => router.push('/metro' as any)}
            accessibilityLabel={t('home.metroLines')}
            style={styles.actionCard}
            contentStyle={styles.actionCardContent}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Ionicons name="subway" size={20} color={theme.primary} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.actionLabel, { color: theme.textPrimary }]}
            >
              {t('home.metroLines')}
            </Text>
          </Card>

          <Card
            variant="default"
            onPress={() => router.push('/bus' as any)}
            accessibilityLabel={t('home.buses')}
            style={styles.actionCard}
            contentStyle={styles.actionCardContent}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Ionicons name="bus" size={20} color={theme.primary} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.actionLabel, { color: theme.textPrimary }]}
            >
              {t('home.buses')}
            </Text>
          </Card>

          <Card
            variant="default"
            onPress={() => router.push('/tickets' as any)}
            accessibilityLabel={t('home.myTickets')}
            style={styles.actionCard}
            contentStyle={styles.actionCardContent}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Ionicons name="ticket" size={20} color={theme.primary} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.actionLabel, { color: theme.textPrimary }]}
            >
              {t('home.myTickets')}
            </Text>
          </Card>
        </View>
      </View>

      {/* Live Recent Journeys & Active Tickets */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('home.recentJourneys')}
          </Text>
          {recentBookings.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/tickets' as any)}
            >
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                See all
              </Text>
            </Pressable>
          ) : null}
        </View>

        {recentBookings.length === 0 ? (
          <Card style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Ionicons name="navigate-outline" size={26} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('home.noRecentJourneys')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {t('home.noRecentJourneysSubtitle')}
            </Text>
          </Card>
        ) : (
          <View style={styles.recentList}>
            {recentBookings.map((b) => {
              const isActive =
                b.status === 'CONFIRMED' && b.ticket?.status === 'ACTIVE';
              return (
                <Card
                  key={b.id}
                  onPress={() => router.push(`/tickets/${b.id}` as any)}
                  style={styles.recentCard}
                  contentStyle={styles.recentCardContent}
                >
                  <View
                    style={[
                      styles.recentIconWrap,
                      {
                        backgroundColor: isActive
                          ? theme.accentSoft
                          : theme.surfaceAlt,
                      },
                    ]}
                  >
                    <Ionicons
                      name={b.transportType === 'METRO' ? 'subway' : 'bus'}
                      size={18}
                      color={isActive ? theme.primary : theme.textSecondary}
                    />
                  </View>

                  <View style={styles.recentTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[styles.recentRoute, { color: theme.textPrimary }]}
                    >
                      {b.originName} → {b.destinationName}
                    </Text>
                    <Text
                      style={[styles.recentMeta, { color: theme.textSecondary }]}
                    >
                      {b.ticket ? b.ticket.ticketCode : b.status} •{' '}
                      {b.totalAmount} {b.currency}
                    </Text>
                  </View>

                  <Badge
                    label={isActive ? 'QR Ready' : b.ticket?.status ?? b.status}
                    variant={isActive ? 'accent' : 'neutral'}
                    size="sm"
                  />
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greetingContainer: {
    flex: 1,
    marginEnd: spacing.md,
  },
  greetingTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  searchSection: {
    marginBottom: spacing.lg,
  },
  searchCard: {
    width: '100%',
  },
  searchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.md,
  },
  searchTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  searchTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.title,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  searchPlaceholder: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  searchTrailing: {
    marginStart: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.label,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionCard: {
    flex: 1,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentList: {
    gap: spacing.sm,
  },
  recentCard: {
    width: '100%',
  },
  recentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  recentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTextCol: {
    flex: 1,
  },
  recentRoute: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  recentMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  emptyCard: {
    width: '100%',
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
