import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Card, Badge, Avatar } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const firstName = user?.fullName?.trim()?.split(/\s+/)?.[0] ?? '';
  const greeting = firstName
    ? t('home.greeting', { name: firstName })
    : t('home.greetingGuest');

  return (
    <Screen>
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
        <Avatar name={user?.fullName ?? user?.email ?? ''} size={44} />
      </View>

      {/* Prominent "Where to?" Search Card */}
      <View style={styles.searchSection}>
        {/* TODO: Wire up route planner / station search sheet when search API is implemented */}
        <Card
          onPress={() => {
            // TODO: Route search / journey planner implementation
          }}
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
            <Ionicons name="search" size={20} color={theme.primary} />
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
            size={24}
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
          {/* Action 1: Metro lines */}
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
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
              {t('home.metroLines')}
            </Text>
          </Card>

          {/* Action 2: Buses */}
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
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
              {t('home.buses')}
            </Text>
          </Card>

          {/* Action 3: My tickets */}
          <Card
            variant="default"
            disabled
            accessibilityLabel={`${t('home.myTickets')} - ${t('home.comingSoon')}`}
            style={styles.actionCard}
            contentStyle={styles.actionCardContent}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <Ionicons name="ticket-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
              {t('home.myTickets')}
            </Text>
            <Badge
              label={t('home.comingSoon')}
              variant="neutral"
              size="sm"
              style={styles.comingSoonBadge}
            />
          </Card>
        </View>
      </View>

      {/* Recent Journeys Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('home.recentJourneys')}
        </Text>
        <Card style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons name="navigate-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {t('home.noRecentJourneys')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {t('home.noRecentJourneysSubtitle')}
          </Text>
        </Card>
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
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  searchSection: {
    marginBottom: spacing.xl,
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
    fontSize: fontSize.title,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  searchPlaceholder: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  searchTrailing: {
    marginStart: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.label,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  comingSoonBadge: {
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
