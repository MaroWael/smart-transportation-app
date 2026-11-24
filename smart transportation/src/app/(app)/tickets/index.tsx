import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import {
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing, Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import {
  BookingRecord,
  fetchMyBookings,
  getStatusErrorKey,
} from '@/lib/transport-api';

type TicketTab = 'ACTIVE' | 'HISTORY';

export default function MyTicketsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TicketTab>('ACTIVE');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchMyBookings(token);
      setBookings(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
      const key = getStatusErrorKey(err);
      setError(t(key as any) as string);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout, t]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
  };

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'CONFIRMED' && b.ticket?.status === 'ACTIVE'
      ),
    [bookings]
  );

  const historyBookings = useMemo(
    () =>
      bookings.filter(
        (b) => !(b.status === 'CONFIRMED' && b.ticket?.status === 'ACTIVE')
      ),
    [bookings]
  );

  const displayedList =
    activeTab === 'ACTIVE' ? activeBookings : historyBookings;

  const getStatusLabel = (b: BookingRecord) => {
    if (b.status === 'CONFIRMED' && b.ticket) {
      if (b.ticket.status === 'ACTIVE') return 'QR Ready';
      if (b.ticket.status === 'USED') return t('tickets.ticketUsed');
      return t('tickets.ticketExpired');
    }
    if (b.status === 'PENDING') return t('tickets.statusPending');
    if (b.status === 'FAILED') return t('tickets.statusFailed');
    return t('tickets.statusCancelled');
  };

  return (
    <Screen
      scrollable
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <ScreenHeader
        title={t('tickets.title')}
        subtitle={t('tickets.subtitle')}
      />

      {/* Segmented Tabs: Active | History */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        {(
          [
            { key: 'ACTIVE', label: `Active (${activeBookings.length})` },
            { key: 'HISTORY', label: `History (${historyBookings.length})` },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabBtn,
                isSelected && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSelected
                      ? Theme.light.onPrimary
                      : theme.textPrimary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.listWrap}>
          {[1, 2, 3].map((i) => (
            <Card key={i} contentStyle={styles.skeletonCard}>
              <Skeleton width="40%" height={14} borderRadius={4} />
              <Skeleton width="80%" height={20} borderRadius={4} />
              <Skeleton width="55%" height={14} borderRadius={4} />
            </Card>
          ))}
        </View>
      ) : error ? (
        <Card contentStyle={styles.emptyContent}>
          <Ionicons name="alert-circle" size={28} color={theme.error} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {error}
          </Text>
          <Button variant="secondary" onPress={() => void loadBookings()}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      ) : displayedList.length === 0 ? (
        <Card contentStyle={styles.emptyContent}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons name="ticket-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {activeTab === 'ACTIVE'
              ? 'No active tickets'
              : 'No past bookings yet'}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {t('tickets.emptySubtitle')}
          </Text>
          {activeTab === 'ACTIVE' ? (
            <Button
              onPress={() => router.push('/journey' as any)}
              style={styles.emptyBtn}
            >
              {t('tickets.planJourneyBtn')}
            </Button>
          ) : null}
        </Card>
      ) : (
        <View style={styles.listWrap}>
          {displayedList.map((b) => {
            const isActive =
              b.status === 'CONFIRMED' && b.ticket?.status === 'ACTIVE';
            return (
              <Card
                key={b.id}
                onPress={() => router.push(`/tickets/${b.id}` as any)}
                style={styles.ticketCard}
                contentStyle={styles.ticketCardContent}
              >
                <View style={styles.ticketHeaderRow}>
                  <View style={styles.modeTag}>
                    <Ionicons
                      name={b.transportType === 'METRO' ? 'subway' : 'bus'}
                      size={15}
                      color={theme.primary}
                    />
                    <Text style={[styles.modeText, { color: theme.primary }]}>
                      {b.transportType === 'METRO'
                        ? 'Cairo Metro'
                        : (b.busRoute?.code ?? 'Cairo Bus')}
                    </Text>
                  </View>
                  <Badge
                    label={getStatusLabel(b)}
                    variant={isActive ? 'accent' : 'neutral'}
                    size="sm"
                  />
                </View>

                <Text style={[styles.routeTitle, { color: theme.textPrimary }]}>
                  {b.originName} → {b.destinationName}
                </Text>

                <View style={styles.ticketFooterRow}>
                  <Text
                    style={[styles.metaText, { color: theme.textSecondary }]}
                  >
                    {b.ticket
                      ? b.ticket.ticketCode
                      : new Date(b.createdAt).toLocaleDateString()}
                  </Text>
                  <Text
                    style={[styles.priceText, { color: theme.textPrimary }]}
                  >
                    {b.totalAmount} {b.currency}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  listWrap: {
    gap: spacing.sm,
  },
  skeletonCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  ticketCard: {
    width: '100%',
  },
  ticketCardContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  routeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
  },
  priceText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: spacing.xs,
    minWidth: 160,
  },
});
