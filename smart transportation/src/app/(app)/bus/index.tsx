import React, { useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { fontSize, fontFamily, spacing } from '@/constants/theme';
import { useBusRoutes } from '@/lib/transport-api';

export default function BusRoutesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: routes, loading, error, refetch } = useBusRoutes();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formattedCount = (count: number) => {
    return new Intl.NumberFormat().format(count);
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
        title={t('bus.routes')}
        subtitle={t('bus.routesSubtitle')}
      />

      {loading && !refreshing ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((key) => (
            <Card key={key} style={styles.card} contentStyle={styles.cardContent}>
              <View style={styles.row}>
                <Skeleton width={70} height={28} borderRadius={theme.radius.full} />
                <View style={styles.skeletonTextWrapper}>
                  <Skeleton width="65%" height={18} borderRadius={4} />
                  <Skeleton
                    width="35%"
                    height={14}
                    borderRadius={4}
                    style={styles.skeletonSub}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : error ? (
        <Card style={styles.errorCard} contentStyle={styles.errorCardContent}>
          <View
            style={[
              styles.errorIconCircle,
              { backgroundColor: theme.errorSoft },
            ]}
          >
            <Ionicons name="alert-circle" size={28} color={theme.error} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            {error}
          </Text>
          <Button
            variant="secondary"
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            {t('common.tryAgain')}
          </Button>
        </Card>
      ) : routes && routes.length > 0 ? (
        <View style={styles.list}>
          {routes.map((route) => {
            const countStr = formattedCount(route.stopCount);
            const stopsLabel = t('bus.stopsCount', {
              count: route.stopCount,
            });

            return (
              <Card
                key={route.id}
                onPress={() => router.push(`/bus/${route.id}` as any)}
                accessibilityLabel={t('bus.routeA11y', {
                  code: route.code,
                  name: route.nameEn,
                  count: countStr,
                })}
                style={styles.card}
                contentStyle={styles.cardContent}
              >
                <View style={styles.row}>
                  {/* Bus Code Chip */}
                  <Badge
                    label={route.code}
                    variant="accent"
                    size="md"
                    style={styles.codeBadge}
                  />

                  {/* Route Info */}
                  <View style={styles.infoWrapper}>
                    <Text
                      numberOfLines={1}
                      style={[styles.routeName, { color: theme.textPrimary }]}
                    >
                      {route.nameEn}
                    </Text>
                    <Text
                      style={[styles.stopsCount, { color: theme.textSecondary }]}
                    >
                      {stopsLabel}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                    style={styles.chevron}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('bus.noRoutesFound')}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  codeBadge: {
    marginEnd: spacing.md,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  routeName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  stopsCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    marginStart: spacing.xs,
  },
  skeletonTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginStart: spacing.md,
  },
  skeletonSub: {
    marginTop: 6,
  },
  errorCard: {
    marginTop: spacing.md,
  },
  errorCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    minWidth: 140,
  },
  emptyCard: {
    marginTop: spacing.md,
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
