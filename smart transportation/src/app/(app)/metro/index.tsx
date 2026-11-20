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
  Button,
  Card,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, fontFamily, spacing, Theme } from '@/constants/theme';
import { useMetroLines } from '@/lib/transport-api';

export default function MetroLinesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: lines, loading, error, refetch } = useMetroLines();
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
        title={t('metro.lines')}
        subtitle={t('metro.linesSubtitle')}
      />

      {loading && !refreshing ? (
        <View style={styles.list}>
          {[1, 2, 3].map((key) => (
            <Card key={key} style={styles.card} contentStyle={styles.cardContent}>
              <View style={styles.row}>
                <Skeleton width={38} height={38} borderRadius={theme.radius.sm} />
                <View style={styles.skeletonTextWrapper}>
                  <Skeleton width="70%" height={18} borderRadius={4} />
                  <Skeleton
                    width="40%"
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
      ) : lines && lines.length > 0 ? (
        <View style={styles.list}>
          {lines.map((line) => {
            const countStr = formattedCount(line.stationCount);
            const stationsLabel = t('metro.stationsCount', {
              count: line.stationCount,
            });

            return (
              <Card
                key={line.id}
                onPress={() => router.push(`/metro/${line.id}` as any)}
                accessibilityLabel={t('metro.lineA11y', {
                  number: line.number,
                  name: line.nameEn,
                  count: countStr,
                })}
                style={styles.card}
                contentStyle={styles.cardContent}
              >
                <View style={styles.row}>
                  {/* Colored Line Number Badge (API runtime color) */}
                  <View
                    style={[
                      styles.numberBadge,
                      { backgroundColor: line.color, borderRadius: theme.radius.sm },
                    ]}
                  >
                    <Text style={styles.numberText}>{line.number}</Text>
                  </View>

                  {/* Line Name & Station Count */}
                  <View style={styles.infoWrapper}>
                    <Text
                      numberOfLines={1}
                      style={[styles.lineName, { color: theme.textPrimary }]}
                    >
                      {line.nameEn}
                    </Text>
                    <Text
                      style={[styles.stationCount, { color: theme.textSecondary }]}
                    >
                      {stationsLabel}
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
            {t('metro.noLinesFound')}
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
  numberBadge: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.md,
  },
  numberText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    fontWeight: '700',
    color: Theme.light.onPrimary,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  lineName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  stationCount: {
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
