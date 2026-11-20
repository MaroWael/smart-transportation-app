import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
import { fontSize, fontFamily, spacing, Theme } from '@/constants/theme';
import { useMetroLine } from '@/lib/transport-api';

export default function MetroLineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: line, loading, error, refetch } = useMetroLine(id);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredStations = useMemo(() => {
    if (!line?.stations) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return line.stations;
    return line.stations.filter((s) =>
      s.nameEn.toLowerCase().includes(query)
    );
  }, [line, searchQuery]);

  const totalStations = line?.stations.length ?? 0;

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
        title={line ? line.nameEn : t('metro.lineDetail')}
        subtitle={
          line
            ? t('metro.stationsCount', { count: totalStations })
            : undefined
        }
      />

      {loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <Skeleton width="60%" height={24} borderRadius={4} />
            <Skeleton width="40%" height={16} borderRadius={4} style={styles.skeletonSub} />
          </Card>
          <View style={styles.timelineList}>
            {[1, 2, 3, 4, 5].map((k) => (
              <View key={k} style={styles.skeletonRow}>
                <Skeleton width={14} height={14} borderRadius={7} />
                <Skeleton
                  width="70%"
                  height={18}
                  borderRadius={4}
                  style={styles.skeletonStationText}
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
      ) : line ? (
        <>
          {/* Header Summary Card */}
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <View style={styles.headerTop}>
              <View
                style={[
                  styles.lineBadge,
                  { backgroundColor: line.color, borderRadius: theme.radius.sm },
                ]}
              >
                <Text style={styles.lineBadgeText}>{line.number}</Text>
              </View>
              <View style={styles.headerTextWrapper}>
                <Text
                  style={[styles.headerTitle, { color: theme.textPrimary }]}
                >
                  {line.nameEn}
                </Text>
                <Text
                  style={[styles.headerSubtitle, { color: theme.textSecondary }]}
                >
                  {t('metro.stationsCount', { count: totalStations })}
                </Text>
              </View>
            </View>

            {/* Client-side search input */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  borderRadius: theme.radius.input,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={theme.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('metro.searchPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.searchInput,
                  { color: theme.textPrimary, fontFamily: fontFamily.regular },
                ]}
                autoCorrect={false}
              />
              {searchQuery ? (
                <Pressable
                  accessibilityLabel={t('metro.clearSearch')}
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
          </Card>

          {/* Vertical Station Timeline */}
          {filteredStations.length > 0 ? (
            <View style={styles.timelineList}>
              {filteredStations.map((station, index) => {
                const isFirst = index === 0;
                const isLast = index === filteredStations.length - 1;
                const isTerminal =
                  station.order === 1 || station.order === totalStations;

                return (
                  <View
                    key={station.id}
                    accessibilityLabel={t('metro.stationA11y', {
                      order: station.order,
                      name: station.nameEn,
                    })}
                    style={styles.timelineItem}
                  >
                    {/* Vertical Timeline Track & Node */}
                    <View style={styles.trackColumn}>
                      {/* Upper track segment */}
                      <View
                        style={[
                          styles.trackSegment,
                          {
                            backgroundColor: isFirst ? 'transparent' : line.color,
                          },
                        ]}
                      />

                      {/* Station Dot Indicator */}
                      <View style={styles.dotContainer}>
                        {station.isInterchange ? (
                          <View
                            style={[
                              styles.interchangeOuterDot,
                              {
                                borderColor: line.color,
                                backgroundColor: theme.surface,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.interchangeInnerDot,
                                { backgroundColor: line.color },
                              ]}
                            />
                          </View>
                        ) : isTerminal ? (
                          <View
                            style={[
                              styles.terminalDot,
                              {
                                backgroundColor: line.color,
                                borderColor: theme.accentSoft,
                              },
                            ]}
                          />
                        ) : (
                          <View
                            style={[
                              styles.normalDot,
                              { backgroundColor: line.color },
                            ]}
                          />
                        )}
                      </View>

                      {/* Lower track segment */}
                      <View
                        style={[
                          styles.trackSegment,
                          {
                            backgroundColor: isLast ? 'transparent' : line.color,
                          },
                        ]}
                      />
                    </View>

                    {/* Station Content & Interchange Details */}
                    <View style={styles.stationContent}>
                      <View style={styles.stationTitleRow}>
                        <Text
                          style={[
                            styles.stationOrder,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {new Intl.NumberFormat().format(station.order)}.
                        </Text>
                        <Text
                          style={[
                            styles.stationName,
                            {
                              color: theme.textPrimary,
                              fontWeight: isTerminal ? '700' : '600',
                            },
                          ]}
                        >
                          {station.nameEn}
                        </Text>
                        {isTerminal ? (
                          <Badge
                            label={t('metro.terminal')}
                            variant="neutral"
                            size="sm"
                            style={styles.terminalBadge}
                          />
                        ) : null}
                      </View>

                      {/* Interchange Info Badge & Lines list */}
                      {station.isInterchange && station.lines.length > 0 ? (
                        <View style={styles.interchangeSection}>
                          <Badge
                            label={t('metro.interchange')}
                            variant="accent"
                            size="sm"
                          />
                          <View style={styles.connectingLinesRow}>
                            <Text
                              style={[
                                styles.transfersLabel,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {t('metro.transfersTo')}:
                            </Text>
                            {station.lines.map((servingLine) => (
                              <View
                                key={servingLine.id}
                                style={[
                                  styles.miniLinePill,
                                  { backgroundColor: servingLine.color },
                                ]}
                              >
                                <Text style={styles.miniLineText}>
                                  {servingLine.number}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Card style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('metro.noStationsFound', { query: searchQuery })}
              </Text>
            </Card>
          )}
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
    marginBottom: spacing.md,
  },
  lineBadge: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.md,
  },
  lineBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    fontWeight: '700',
    color: Theme.light.onPrimary,
  },
  headerTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginEnd: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  timelineList: {
    paddingVertical: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
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
  interchangeOuterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interchangeInnerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stationContent: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingStart: spacing.sm,
    justifyContent: 'center',
  },
  stationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stationOrder: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    marginEnd: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  stationName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    letterSpacing: -0.2,
  },
  terminalBadge: {
    marginStart: spacing.sm,
  },
  interchangeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  connectingLinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginStart: spacing.xs,
    gap: 4,
  },
  transfersLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  miniLinePill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLineText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: Theme.light.onPrimary,
  },
  skeletonSub: {
    marginTop: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: spacing.sm,
  },
  skeletonStationText: {
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
