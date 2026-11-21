import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
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

const LINE3_ROD_EL_FARAG_STATIONS = new Set([
  'sudan',
  'imbaba',
  'el-bohi',
  'el-bohy',
  'el-qawmia',
  'ring road',
  'rod el-farag corridor',
  'rod el-farag',
]);

const LINE3_CAIRO_UNI_STATIONS = new Set([
  'tawfikia',
  'wadi el-nile',
  'wadi el nile',
  'gamaat el-dowal',
  'gamet el dowel',
  'boulak el-dakrour',
  'boulak el dakrour',
  'cairo university',
]);

export default function MetroLineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: line, loading, error, refetch } = useMetroLine(id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Normalize stations: use backend `branch` field when present, with safe fallback for Line 3
  const normalizedStations = useMemo(() => {
    if (!line?.stations) return [];
    const hasBackendBranches = line.stations.some((s) => Boolean(s.branch));
    if (hasBackendBranches || line.number !== 3) {
      return line.stations;
    }
    return line.stations.map((s) => {
      const lower = s.nameEn.trim().toLowerCase();
      if (LINE3_ROD_EL_FARAG_STATIONS.has(lower)) {
        return { ...s, branch: 'Rod El-Farag Corridor Branch' };
      }
      if (LINE3_CAIRO_UNI_STATIONS.has(lower)) {
        return { ...s, branch: 'Cairo University Branch' };
      }
      return { ...s, branch: null };
    });
  }, [line]);

  const branches = useMemo(() => {
    if (line?.branches && line.branches.length > 0) return line.branches;
    return Array.from(
      new Set(
        normalizedStations
          .map((s) => s.branch)
          .filter((b): b is string => Boolean(b))
      )
    );
  }, [line, normalizedStations]);

  const hasBranches = branches.length > 0;

  // Identify the last main-trunk station (branch hub, e.g., Kit Kat) and terminal station IDs
  const { branchHubId, terminalStationIds } = useMemo(() => {
    const terminals = new Set<string>();
    let hubId: string | null = null;
    if (normalizedStations.length === 0) {
      return { branchHubId: hubId, terminalStationIds: terminals };
    }

    terminals.add(normalizedStations[0].id);

    if (!hasBranches) {
      terminals.add(normalizedStations[normalizedStations.length - 1].id);
    } else {
      const trunk = normalizedStations.filter((s) => !s.branch);
      if (trunk.length > 0) {
        hubId = trunk[trunk.length - 1].id;
      }
      for (const branchName of branches) {
        const branchStations = normalizedStations.filter(
          (s) => s.branch === branchName
        );
        if (branchStations.length > 0) {
          terminals.add(branchStations[branchStations.length - 1].id);
        }
      }
    }
    return { branchHubId: hubId, terminalStationIds: terminals };
  }, [normalizedStations, hasBranches, branches]);

  const filteredStations = useMemo(() => {
    if (normalizedStations.length === 0) return [];
    const branchFiltered = selectedBranch
      ? normalizedStations.filter(
          (s) => !s.branch || s.branch === selectedBranch
        )
      : normalizedStations;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return branchFiltered;
    return branchFiltered.filter((s) =>
      s.nameEn.toLowerCase().includes(query)
    );
  }, [normalizedStations, selectedBranch, searchQuery]);

  // Split into main trunk + parallel branches for the true 2-way fork UI below Kit Kat
  const showForkView =
    hasBranches && !selectedBranch && !searchQuery.trim() && branches.length >= 2;

  const trunkStations = useMemo(
    () => normalizedStations.filter((s) => !s.branch),
    [normalizedStations]
  );

  const branchGroups = useMemo(() => {
    if (normalizedStations.length === 0 || !hasBranches) return [];
    return branches.map((branchName) => ({
      name: branchName,
      shortName: branchName.replace(/\s*Branch$/i, ''),
      stations: normalizedStations.filter((s) => s.branch === branchName),
    }));
  }, [normalizedStations, hasBranches, branches]);

  const totalStations = normalizedStations.length;

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

            {/* Branch Filter Pills (shown for lines with diverging branches, e.g., Line 3 at Kit Kat) */}
            {hasBranches ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.branchFilterRow}
                style={styles.branchFilterScroll}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedBranch(null)}
                  style={[
                    styles.branchPill,
                    {
                      backgroundColor:
                        selectedBranch === null ? line.color : theme.surfaceAlt,
                      borderColor:
                        selectedBranch === null ? line.color : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.branchPillText,
                      {
                        color:
                          selectedBranch === null
                            ? Theme.light.onPrimary
                            : theme.textPrimary,
                      },
                    ]}
                  >
                    {t('metro.allBranches')}
                  </Text>
                </Pressable>
                {branches.map((branchName) => {
                  const isActive = selectedBranch === branchName;
                  return (
                    <Pressable
                      key={branchName}
                      accessibilityRole="button"
                      onPress={() => setSelectedBranch(branchName)}
                      style={[
                        styles.branchPill,
                        {
                          backgroundColor: isActive ? line.color : theme.surfaceAlt,
                          borderColor: isActive ? line.color : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.branchPillText,
                          {
                            color: isActive
                              ? Theme.light.onPrimary
                              : theme.textPrimary,
                          },
                        ]}
                      >
                        {branchName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </Card>

          {/* Vertical Station Timeline (with true 2-way visual fork from Kit Kat) */}
          {showForkView ? (
            <View style={styles.timelineList}>
              {/* 1. Main Trunk (Adly Mansour -> ... -> Kit Kat) */}
              {trunkStations.map((station, index) => {
                const isFirst = index === 0;
                const isBranchHub = station.id === branchHubId;
                const isTerminal = terminalStationIds.has(station.id);

                return (
                  <View
                    key={station.id}
                    accessibilityLabel={t('metro.stationA11y', {
                      order: station.order,
                      name: station.nameEn,
                    })}
                    style={styles.timelineItem}
                  >
                    <View style={styles.trackColumn}>
                      <View
                        style={[
                          styles.trackSegment,
                          {
                            backgroundColor: isFirst
                              ? 'transparent'
                              : line.color,
                          },
                        ]}
                      />
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
                        ) : isBranchHub ? (
                          <View
                            style={[
                              styles.hubDot,
                              {
                                borderColor: line.color,
                                backgroundColor: theme.surface,
                              },
                            ]}
                          >
                            <Ionicons
                              name="git-branch"
                              size={11}
                              color={line.color}
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
                      <View
                        style={[
                          styles.trackSegment,
                          { backgroundColor: line.color },
                        ]}
                      />
                    </View>

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
                              fontWeight:
                                isTerminal || isBranchHub ? '700' : '600',
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
                        {isBranchHub ? (
                          <Badge
                            label={t('metro.branchHub')}
                            variant="accent"
                            size="sm"
                            style={styles.terminalBadge}
                          />
                        ) : null}
                      </View>

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

              {/* 2. Visual Fork Connector splitting the main track into 2 parallel ways */}
              <View style={styles.forkConnector}>
                <View
                  style={[styles.forkStemTop, { backgroundColor: line.color }]}
                />
                <View
                  style={[styles.forkBridgeRow, { borderColor: line.color }]}
                >
                  <View
                    style={[
                      styles.forkLegLeft,
                      { backgroundColor: line.color },
                    ]}
                  />
                  <View
                    style={[
                      styles.forkLegRight,
                      { backgroundColor: line.color },
                    ]}
                  />
                </View>
              </View>

              {/* 3. Two Side-by-Side Diverging Branches */}
              <View style={styles.forkColumns}>
                {branchGroups.map((group) => (
                  <View
                    key={group.name}
                    style={[
                      styles.forkColumnCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.forkColumnHeader,
                        {
                          backgroundColor: theme.surfaceAlt,
                          borderBottomColor: theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="git-branch-outline"
                        size={13}
                        color={line.color}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.forkColumnTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {group.shortName}
                      </Text>
                    </View>

                    <View style={styles.forkColumnBody}>
                      {group.stations.map((station, bIndex) => {
                        const isFirstInBranch = bIndex === 0;
                        const isLastInBranch =
                          bIndex === group.stations.length - 1;
                        const isTerminal = terminalStationIds.has(station.id);

                        return (
                          <View
                            key={station.id}
                            accessibilityLabel={t('metro.stationA11y', {
                              order: trunkStations.length + bIndex + 1,
                              name: station.nameEn,
                            })}
                            style={styles.branchItem}
                          >
                            <View style={styles.branchTrackCol}>
                              <View
                                style={[
                                  styles.branchTrackSeg,
                                  {
                                    backgroundColor: isFirstInBranch
                                      ? line.color
                                      : line.color,
                                  },
                                ]}
                              />
                              <View style={styles.branchDotContainer}>
                                {station.isInterchange ? (
                                  <View
                                    style={[
                                      styles.branchInterchangeOuter,
                                      {
                                        borderColor: line.color,
                                        backgroundColor: theme.surface,
                                      },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.branchInterchangeInner,
                                        { backgroundColor: line.color },
                                      ]}
                                    />
                                  </View>
                                ) : isTerminal ? (
                                  <View
                                    style={[
                                      styles.branchTerminalDot,
                                      {
                                        backgroundColor: line.color,
                                        borderColor: theme.accentSoft,
                                      },
                                    ]}
                                  />
                                ) : (
                                  <View
                                    style={[
                                      styles.branchNormalDot,
                                      { backgroundColor: line.color },
                                    ]}
                                  />
                                )}
                              </View>
                              <View
                                style={[
                                  styles.branchTrackSeg,
                                  {
                                    backgroundColor: isLastInBranch
                                      ? 'transparent'
                                      : line.color,
                                  },
                                ]}
                              />
                            </View>

                            <View style={styles.branchStationContent}>
                              <Text
                                style={[
                                  styles.branchStationName,
                                  {
                                    color: theme.textPrimary,
                                    fontWeight: isTerminal ? '700' : '600',
                                  },
                                ]}
                              >
                                {station.nameEn}
                              </Text>

                              {(isTerminal || station.isInterchange) ? (
                                <View style={styles.branchBadgesRow}>
                                  {isTerminal ? (
                                    <Badge
                                      label={t('metro.terminal')}
                                      variant="neutral"
                                      size="sm"
                                    />
                                  ) : null}
                                  {station.isInterchange &&
                                  station.lines.length > 0 ? (
                                    <View style={styles.branchPillsRow}>
                                      {station.lines.map((servingLine) => (
                                        <View
                                          key={servingLine.id}
                                          style={[
                                            styles.miniLinePill,
                                            {
                                              backgroundColor:
                                                servingLine.color,
                                            },
                                          ]}
                                        >
                                          <Text style={styles.miniLineText}>
                                            {servingLine.number}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  ) : null}
                                </View>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : filteredStations.length > 0 ? (
            <View style={styles.timelineList}>
              {filteredStations.map((station, index) => {
                const isFirst = index === 0;
                const isLast = index === filteredStations.length - 1;
                const isTerminal = terminalStationIds.has(station.id);
                const isBranchHub = station.id === branchHubId;
                const displayOrder = selectedBranch ? index + 1 : station.order;

                return (
                  <View
                    key={station.id}
                    accessibilityLabel={t('metro.stationA11y', {
                      order: displayOrder,
                      name: station.nameEn,
                    })}
                    style={styles.timelineItem}
                  >
                    <View style={styles.trackColumn}>
                      <View
                        style={[
                          styles.trackSegment,
                          {
                            backgroundColor: isFirst
                              ? 'transparent'
                              : line.color,
                          },
                        ]}
                      />
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
                      <View
                        style={[
                          styles.trackSegment,
                          {
                            backgroundColor: isLast
                              ? 'transparent'
                              : line.color,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.stationContent}>
                      <View style={styles.stationTitleRow}>
                        <Text
                          style={[
                            styles.stationOrder,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {new Intl.NumberFormat().format(displayOrder)}.
                        </Text>
                        <Text
                          style={[
                            styles.stationName,
                            {
                              color: theme.textPrimary,
                              fontWeight:
                                isTerminal || isBranchHub ? '700' : '600',
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
                        {isBranchHub ? (
                          <Badge
                            label={t('metro.branchHub')}
                            variant="accent"
                            size="sm"
                            style={styles.terminalBadge}
                          />
                        ) : null}
                      </View>

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
  branchFilterScroll: {
    marginTop: spacing.sm,
  },
  branchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  branchPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  branchPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  hubDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forkConnector: {
    width: '100%',
    alignItems: 'flex-start',
  },
  forkStemTop: {
    width: 3,
    height: 14,
    marginStart: 14.5,
  },
  forkBridgeRow: {
    width: '50%',
    height: 16,
    marginStart: 14.5,
    borderTopWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forkLegLeft: {
    width: 3,
    height: '100%',
  },
  forkLegRight: {
    width: 3,
    height: '100%',
  },
  forkColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  forkColumnCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  forkColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  forkColumnTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  forkColumnBody: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  branchItem: {
    flexDirection: 'row',
    minHeight: 48,
  },
  branchTrackCol: {
    width: 20,
    alignItems: 'center',
  },
  branchTrackSeg: {
    flex: 1,
    width: 2.5,
  },
  branchDotContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchNormalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  branchTerminalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  branchInterchangeOuter: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchInterchangeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  branchStationContent: {
    flex: 1,
    paddingVertical: 6,
    paddingStart: 6,
    justifyContent: 'center',
  },
  branchStationName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  branchBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  branchPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
