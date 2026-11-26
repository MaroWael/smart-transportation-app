import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Card, Badge, Avatar } from '@/components/ui';
import { TransitLoadingScreen } from '@/components/transit-loading-screen';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import {
  BookingRecord,
  fetchMyBookings,
  fetchTicketValidations,
  TicketValidationLogItem,
} from '@/lib/transport-api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const isStaffOnly = user?.role === 'STATION_EMPLOYEE';
  const isStaffOrAdmin =
    user?.role === 'STATION_EMPLOYEE' || user?.role === 'ADMIN';

  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);
  const [recentScans, setRecentScans] = useState<TicketValidationLogItem[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isInitialLoading = Boolean(user?.id && loadedUserId !== user.id);

  // Reset cached state whenever a different user logs in
  useEffect(() => {
    if (user?.id && loadedUserId && loadedUserId !== user.id) {
      setRecentBookings([]);
      setRecentScans([]);
      fadeAnim.setValue(0);
    }
  }, [user?.id, loadedUserId, fadeAnim]);

  const loadHomeData = useCallback(async () => {
    if (!token || !user?.id) return;
    const targetUserId = user.id;
    try {
      if (isStaffOnly) {
        const scans = await fetchTicketValidations(token);
        setRecentScans(scans);
      } else {
        const data = await fetchMyBookings(token);
        setRecentBookings(data.slice(0, 4));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
    } finally {
      setLoadedUserId(targetUserId);
      setRefreshing(false);
    }
  }, [token, user?.id, isStaffOnly, logout]);

  useEffect(() => {
    if (!isInitialLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [isInitialLoading, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
  };

  if (isInitialLoading) {
    return (
      <Modal
        visible
        transparent={false}
        animationType="none"
        statusBarTranslucent
      >
        <TransitLoadingScreen
          isStaff={isStaffOnly}
          userName={user?.fullName ?? undefined}
        />
      </Modal>
    );
  }

  const firstName = user?.fullName?.trim()?.split(/\s+/)?.[0] ?? '';
  const greeting = firstName
    ? t('home.greeting', { name: firstName })
    : t('home.greetingGuest');

  // Dedicated Station Employee Dashboard (no passenger booking/my-tickets clutter)
  if (isStaffOnly) {
    const validCount = recentScans.filter((s) => s.result === 'VALID').length;
    const rejectedCount = recentScans.length - validCount;

    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
        {/* Top Bar: Staff Greeting + Role Badge + Avatar */}
        <View style={styles.topHeader}>
          <View style={styles.greetingContainer}>
            <View style={styles.staffRolePill}>
              <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
              <Text style={[styles.staffRoleText, { color: theme.primary }]}>
                STATION STAFF
              </Text>
            </View>
            <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>
              {greeting}
            </Text>
            <Text
              style={[styles.greetingSubtitle, { color: theme.textSecondary }]}
            >
              Gate ticket verification & network info
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/(tabs)/profile' as any)}
          >
            <Avatar name={user?.fullName ?? user?.email ?? ''} size={44} />
          </Pressable>
        </View>

        {/* Primary Hero Action: Scan Passenger Ticket */}
        <View style={styles.searchSection}>
          <Card
            onPress={() => router.push('/staff/scanner' as any)}
            accessibilityLabel="Scan passenger QR ticket"
            style={[styles.staffHeroCard, { backgroundColor: theme.primary }]}
            contentStyle={styles.staffHeroContent}
          >
            <View style={styles.staffHeroIconWrap}>
              <Ionicons name="qr-code" size={24} color={theme.primary} />
            </View>
            <View style={styles.searchTextWrapper}>
              <Text style={styles.staffHeroTitle}>Scan Passenger Ticket</Text>
              <Text style={styles.staffHeroSub} numberOfLines={1}>
                Open camera scanner or verify ticket code
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFFFFF" />
          </Card>
        </View>

        {/* Scan Stats Strip */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Validation Summary
          </Text>
          <View style={styles.statsRow}>
            <Card style={styles.statCard} contentStyle={styles.statCardContent}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {recentScans.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Scans
              </Text>
            </Card>
            <Card style={styles.statCard} contentStyle={styles.statCardContent}>
              <Text style={[styles.statNumber, { color: '#16A34A' }]}>
                {validCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Valid
              </Text>
            </Card>
            <Card style={styles.statCard} contentStyle={styles.statCardContent}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                {rejectedCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Rejected
              </Text>
            </Card>
          </View>
        </View>

        {/* Network Reference (Metro & Bus only — no passenger ticket booking) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Transit Network Reference
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
                style={[styles.actionLabel, { color: theme.textPrimary }]}
              >
                {t('home.buses')}
              </Text>
            </Card>
          </View>
        </View>

        {/* Recent Ticket Validations */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Recent Scans
            </Text>
            {recentScans.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/staff/scanner' as any)}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>
                  Open scanner
                </Text>
              </Pressable>
            ) : null}
          </View>

          {recentScans.length === 0 ? (
            <Card style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons name="scan-outline" size={26} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No scans yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
              >
                Tap “Scan Passenger Ticket” above to verify QR passes at the gate.
              </Text>
            </Card>
          ) : (
            <View style={styles.recentList}>
              {recentScans.slice(0, 5).map((scan) => {
                const isValid = scan.result === 'VALID';
                const iconBg = isValid
                  ? '#DCFCE7'
                  : scan.result === 'ALREADY_USED'
                    ? '#FEF3C7'
                    : '#FEE2E2';
                const iconColor = isValid
                  ? '#16A34A'
                  : scan.result === 'ALREADY_USED'
                    ? '#D97706'
                    : '#DC2626';
                return (
                  <Card
                    key={scan.id}
                    onPress={() => router.push('/staff/scanner' as any)}
                    style={styles.recentCard}
                    contentStyle={styles.recentCardContent}
                  >
                    <View
                      style={[
                        styles.recentIconWrap,
                        { backgroundColor: iconBg },
                      ]}
                    >
                      <Ionicons
                        name={isValid ? 'checkmark-circle' : 'alert-circle'}
                        size={19}
                        color={iconColor}
                      />
                    </View>
                    <View style={styles.recentTextCol}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.recentRoute,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {scan.ticket
                          ? `${scan.ticket.booking.originName} → ${scan.ticket.booking.destinationName}`
                          : scan.scannedCode}
                      </Text>
                      <Text
                        style={[
                          styles.recentMeta,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {scan.ticket
                          ? `${scan.ticket.ticketCode} • ${scan.ticket.booking.passengerName}`
                          : (scan.notes ?? 'Invalid code')}
                      </Text>
                    </View>
                    <Badge
                      label={scan.result.replace('_', ' ')}
                      variant={isValid ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </Screen>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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

      {/* Admin QR Scanner shortcut (ADMIN can access both passenger & staff flows) */}
      {isStaffOrAdmin ? (
        <View style={styles.searchSection}>
          <Card
            onPress={() => router.push('/staff/scanner' as any)}
            accessibilityLabel="Scan passenger QR ticket"
            style={[styles.searchCard, { borderColor: theme.primary }]}
            contentStyle={styles.searchCardContent}
          >
            <View
              style={[
                styles.searchIconCircle,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.searchTextWrapper}>
              <Text style={[styles.searchTitle, { color: theme.textPrimary }]}>
                Scan Passenger Ticket
              </Text>
              <Text
                style={[styles.searchPlaceholder, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                Verify QR boarding passes & view scan log
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
      ) : null}

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
    </Animated.View>
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
  staffRolePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    marginBottom: 6,
  },
  staffRoleText: {
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  staffHeroCard: {
    width: '100%',
    borderWidth: 0,
  },
  staffHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  staffHeroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 14,
  },
  staffHeroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  staffHeroSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    marginTop: 2,
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
