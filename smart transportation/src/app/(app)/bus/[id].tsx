import React, { useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { useBusRoute } from '@/lib/transport-api';

export default function BusRouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: route, loading, error, refetch } = useBusRoute(id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const totalStops = route?.stops.length ?? 0;

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
        title={route ? route.code : t('bus.routeDetail')}
        subtitle={route ? route.nameEn : undefined}
      />

      {loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <Skeleton width="40%" height={24} borderRadius={theme.radius.full} />
            <Skeleton width="70%" height={18} borderRadius={4} style={styles.skeletonSub} />
          </Card>
          <View style={styles.timelineList}>
            {[1, 2, 3, 4, 5].map((k) => (
              <View key={k} style={styles.skeletonRow}>
                <Skeleton width={12} height={12} borderRadius={6} />
                <Skeleton
                  width="70%"
                  height={18}
                  borderRadius={4}
                  style={styles.skeletonStopText}
                />
              </View>
            ))}
          </View>
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
      ) : route ? (
        <>
          {/* Header Summary Card */}
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <View style={styles.headerTop}>
              <Badge
                label={route.code}
                variant="accent"
                size="md"
                style={styles.codeBadge}
              />
              <Text
                style={[styles.stopsHeaderCount, { color: theme.textSecondary }]}
              >
                {t('bus.stopsCount', { count: totalStops })}
              </Text>
            </View>
            <Text style={[styles.routeNameLarge, { color: theme.textPrimary }]}>
              {route.nameEn}
            </Text>
          </Card>

          {/* Vertical Stop Timeline */}
          <View style={styles.timelineList}>
            {route.stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === route.stops.length - 1;
              const isTerminal = isFirst || isLast;

              return (
                <View
                  key={stop.id}
                  accessibilityLabel={t('bus.stopA11y', {
                    order: stop.order,
                    name: stop.nameEn,
                  })}
                  style={styles.timelineItem}
                >
                  {/* Timeline Track & Node */}
                  <View style={styles.trackColumn}>
                    {/* Upper track segment */}
                    <View
                      style={[
                        styles.trackSegment,
                        {
                          backgroundColor: isFirst ? 'transparent' : theme.accentSoft,
                        },
                      ]}
                    />

                    {/* Dot */}
                    <View style={styles.dotContainer}>
                      {isTerminal ? (
                        <View
                          style={[
                            styles.terminalDot,
                            {
                              backgroundColor: theme.primary,
                              borderColor: theme.accentSoft,
                            },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.normalDot,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      )}
                    </View>

                    {/* Lower track segment */}
                    <View
                      style={[
                        styles.trackSegment,
                        {
                          backgroundColor: isLast ? 'transparent' : theme.accentSoft,
                        },
                      ]}
                    />
                  </View>

                  {/* Stop Content */}
                  <View style={styles.stopContent}>
                    <View style={styles.stopTitleRow}>
                      <Text
                        style={[
                          styles.stopOrder,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Intl.NumberFormat().format(stop.order)}.
                      </Text>
                      <Text
                        style={[
                          styles.stopName,
                          {
                            color: theme.textPrimary,
                            fontWeight: isTerminal ? '700' : '600',
                          },
                        ]}
                      >
                        {stop.nameEn}
                      </Text>
                      {isTerminal ? (
                        <Badge
                          label={t('bus.terminal')}
                          variant="neutral"
                          size="sm"
                          style={styles.terminalBadge}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  headerCard: {
    width: '100%',
    marginBottom: spacing.md,
  },
  headerCardContent: {
    padding: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  codeBadge: {
    alignSelf: 'flex-start',
  },
  stopsHeaderCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    fontVariant: ['tabular-nums'],
  },
  routeNameLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: spacing.xs,
  },
  timelineList: {
    paddingVertical: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  trackColumn: {
    width: 32,
    alignItems: 'center',
  },
  trackSegment: {
    flex: 1,
    width: 3,
  },
  dotContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  stopContent: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingStart: spacing.sm,
    justifyContent: 'center',
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stopOrder: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginEnd: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  stopName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    letterSpacing: -0.2,
  },
  terminalBadge: {
    marginStart: spacing.sm,
  },
  skeletonSub: {
    marginTop: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: spacing.sm,
  },
  skeletonStopText: {
    marginStart: spacing.sm,
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
});
