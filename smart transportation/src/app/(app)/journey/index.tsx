import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { StripePaymentSheet } from '@/components/stripe-payment-sheet';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing, Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import {
  BusRouteDetail,
  BusRouteSummary,
  BusStopItem,
  calculateJourney,
  confirmBookingPayment,
  createBooking,
  fetchBusRouteById,
  fetchBusRoutes,
  fetchStations,
  getStatusErrorKey,
  JourneyCalculationResult,
  StationItem,
  StripeTestCardToken,
  TestPaymentOutcome,
  TransportType,
} from '@/lib/transport-api';

type PickerKind =
  | 'metro-origin'
  | 'metro-dest'
  | 'bus-route'
  | 'bus-origin'
  | 'bus-dest'
  | null;

export default function JourneyPlannerScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token, logout } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<TransportType>('METRO');

  // Metro state
  const [stations, setStations] = useState<StationItem[]>([]);
  const [originStation, setOriginStation] = useState<StationItem | null>(null);
  const [destStation, setDestStation] = useState<StationItem | null>(null);

  // Bus state
  const [busRoutes, setBusRoutes] = useState<BusRouteSummary[]>([]);
  const [selectedBusRoute, setSelectedBusRoute] = useState<BusRouteSummary | null>(null);
  const [busRouteDetail, setBusRouteDetail] = useState<BusRouteDetail | null>(null);
  const [originStop, setOriginStop] = useState<BusStopItem | null>(null);
  const [destStop, setDestStop] = useState<BusStopItem | null>(null);

  // Picker modal state
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Calculation & direct Stripe payment sheet state
  const [calculating, setCalculating] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [showStops, setShowStops] = useState(false);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<JourneyCalculationResult | null>(null);

  // Load metro stations & bus routes on mount
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.all([
      fetchStations(token, undefined, controller.signal),
      fetchBusRoutes(token, controller.signal),
    ])
      .then(([loadedStations, loadedRoutes]) => {
        setStations(loadedStations);
        setBusRoutes(loadedRoutes);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
        }
      });

    return () => controller.abort();
  }, [token, logout]);

  // Load bus route stops whenever selected bus route changes
  useEffect(() => {
    if (!token || !selectedBusRoute) {
      setBusRouteDetail(null);
      return;
    }
    const controller = new AbortController();

    fetchBusRouteById(selectedBusRoute.id, token, controller.signal)
      .then((detail) => setBusRouteDetail(detail))
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
        }
      });

    return () => controller.abort();
  }, [token, selectedBusRoute, logout]);

  const handleModeChange = (nextMode: TransportType) => {
    setMode(nextMode);
    setErrorMessage(null);
    setResult(null);
  };

  const handleSwap = () => {
    setErrorMessage(null);
    setResult(null);
    if (mode === 'METRO') {
      const prevOrigin = originStation;
      setOriginStation(destStation);
      setDestStation(prevOrigin);
    } else {
      const prevStop = originStop;
      setOriginStop(destStop);
      setDestStop(prevStop);
    }
  };

  // Auto-calculate fare as soon as both origin & destination are chosen (or swapped)
  useEffect(() => {
    if (!token) return;

    if (mode === 'METRO') {
      if (!originStation || !destStation) {
        setErrorMessage(null);
        setResult(null);
        return;
      }
      if (originStation.id === destStation.id) {
        setResult(null);
        setErrorMessage(t('journey.sameSelectionError'));
        return;
      }
    } else {
      if (!selectedBusRoute || !originStop || !destStop) {
        setErrorMessage(null);
        setResult(null);
        return;
      }
      if (originStop.id === destStop.id) {
        setResult(null);
        setErrorMessage(t('journey.sameSelectionError'));
        return;
      }
    }

    const controller = new AbortController();
    setErrorMessage(null);
    setCalculating(true);

    const payload =
      mode === 'METRO'
        ? {
            transportType: 'METRO' as const,
            originStationId: originStation!.id,
            destinationStationId: destStation!.id,
          }
        : {
            transportType: 'BUS' as const,
            busRouteId: selectedBusRoute!.id,
            originStopId: originStop!.id,
            destinationStopId: destStop!.id,
          };

    calculateJourney(payload, token, controller.signal)
      .then((calculated) => {
        if (!controller.signal.aborted) {
          setResult(calculated);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorMessage(t(key as any) as string);
        setResult(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCalculating(false);
        }
      });

    return () => controller.abort();
  }, [
    token,
    mode,
    originStation,
    destStation,
    selectedBusRoute,
    originStop,
    destStop,
    logout,
    t,
  ]);

  const [openingCheckout, setOpeningCheckout] = useState(false);

  const handleOpenCheckoutSheet = async () => {
    if (!token || !result) return;
    setSheetError(null);
    setInfoNotice(null);
    setErrorMessage(null);
    setOpeningCheckout(true);
    try {
      // Create a real PENDING booking + Stripe PaymentIntent immediately so Cancel & Retry are 100% real
      const payload =
        mode === 'METRO'
          ? {
              transportType: 'METRO' as const,
              originStationId: originStation!.id,
              destinationStationId: destStation!.id,
            }
          : {
              transportType: 'BUS' as const,
              busRouteId: selectedBusRoute!.id,
              originStopId: originStop!.id,
              destinationStopId: destStop!.id,
            };
      const created = await createBooking(payload, token);
      setPendingBookingId(created.booking.id);
      setSheetVisible(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
      const key = getStatusErrorKey(err);
      setErrorMessage(t(key as any) as string);
    } finally {
      setOpeningCheckout(false);
    }
  };

  const handleCancelPayment = async () => {
    if (token && pendingBookingId) {
      try {
        await confirmBookingPayment(pendingBookingId, 'CANCELLED', token);
      } catch {
        // Ignore network errors on cancel cleanup
      }
      setPendingBookingId(null);
    }
    setSheetVisible(false);
    setInfoNotice('Payment cancelled. No charge was made.');
  };

  const handlePayNow = async (
    outcome: TestPaymentOutcome,
    paymentMethodToken: StripeTestCardToken
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!token || !pendingBookingId) {
      return { ok: false, error: 'Booking session expired. Please try again.' };
    }
    setPaying(true);
    setSheetError(null);
    try {
      const confirmed = await confirmBookingPayment(
        pendingBookingId,
        outcome,
        token,
        paymentMethodToken
      );
      if (confirmed.status === 'CONFIRMED') {
        setSheetVisible(false);
        setPendingBookingId(null);
        router.replace(`/tickets/${confirmed.id}` as any);
        return { ok: true };
      }

      return {
        ok: false,
        error:
          confirmed.failureReason ||
          'Your card was declined by Stripe. Please try another card.',
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSheetVisible(false);
        await logout();
        return { ok: false };
      }
      const key = getStatusErrorKey(err);
      const msg = t(key as any) as string;
      setSheetError(msg);
      return { ok: false, error: msg };
    } finally {
      setPaying(false);
    }
  };

  const openPicker = (kind: PickerKind) => {
    setPickerSearch('');
    setPickerKind(kind);
  };

  const pickerItems = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (pickerKind === 'metro-origin' || pickerKind === 'metro-dest') {
      return stations.filter((s) => !q || s.nameEn.toLowerCase().includes(q));
    }
    if (pickerKind === 'bus-route') {
      return busRoutes.filter(
        (r) =>
          !q ||
          r.nameEn.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q)
      );
    }
    if (pickerKind === 'bus-origin' || pickerKind === 'bus-dest') {
      const stops = busRouteDetail?.stops ?? [];
      return stops.filter((s) => !q || s.nameEn.toLowerCase().includes(q));
    }
    return [];
  }, [pickerKind, pickerSearch, stations, busRoutes, busRouteDetail]);

  const pickerTitle = useMemo(() => {
    switch (pickerKind) {
      case 'metro-origin':
        return t('journey.originStation');
      case 'metro-dest':
        return t('journey.destinationStation');
      case 'bus-route':
        return t('journey.selectBusRoute');
      case 'bus-origin':
        return t('journey.originStop');
      case 'bus-dest':
        return t('journey.destinationStop');
      default:
        return '';
    }
  }, [pickerKind, t]);

  const pickerPlaceholder = useMemo(() => {
    if (pickerKind === 'bus-route') return t('journey.searchRoutePlaceholder');
    if (pickerKind === 'bus-origin' || pickerKind === 'bus-dest') {
      return t('journey.searchStopPlaceholder');
    }
    return t('journey.searchStationPlaceholder');
  }, [pickerKind, t]);

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <ScreenHeader
        title={t('journey.title')}
        subtitle={t('journey.subtitle')}
      />

      {/* Mode Switcher: Metro | Bus */}
      <View
        style={[
          styles.modeSwitch,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        {(['METRO', 'BUS'] as TransportType[]).map((tab) => {
          const isActive = mode === tab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="button"
              onPress={() => handleModeChange(tab)}
              style={[
                styles.modeBtn,
                isActive && { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons
                name={tab === 'METRO' ? 'subway' : 'bus'}
                size={16}
                color={isActive ? Theme.light.onPrimary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color: isActive
                      ? Theme.light.onPrimary
                      : theme.textPrimary,
                  },
                ]}
              >
                {tab === 'METRO'
                  ? t('journey.modeMetro')
                  : t('journey.modeBus')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selection Form Card */}
      <Card style={styles.formCard} contentStyle={styles.formCardContent}>
        {mode === 'BUS' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openPicker('bus-route')}
            style={[
              styles.fieldRow,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="bus-outline" size={18} color={theme.primary} />
            <View style={styles.fieldTextCol}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {t('journey.selectBusRoute')}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.fieldValue,
                  {
                    color: selectedBusRoute
                      ? theme.textPrimary
                      : theme.textSecondary,
                  },
                ]}
              >
                {selectedBusRoute
                  ? `${selectedBusRoute.code} — ${selectedBusRoute.nameEn}`
                  : t('journey.selectPlaceholder')}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}

        <View style={styles.endpointsRow}>
          <View style={styles.endpointsCol}>
            {/* Origin */}
            <Pressable
              accessibilityRole="button"
              disabled={mode === 'BUS' && !selectedBusRoute}
              onPress={() =>
                openPicker(mode === 'METRO' ? 'metro-origin' : 'bus-origin')
              }
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  opacity: mode === 'BUS' && !selectedBusRoute ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name="radio-button-on" size={16} color={theme.primary} />
              <View style={styles.fieldTextCol}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {mode === 'METRO'
                    ? t('journey.originStation')
                    : t('journey.originStop')}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.fieldValue,
                    {
                      color: (mode === 'METRO' ? originStation : originStop)
                        ? theme.textPrimary
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {mode === 'METRO'
                    ? (originStation?.nameEn ?? t('journey.selectPlaceholder'))
                    : (originStop?.nameEn ?? t('journey.selectPlaceholder'))}
                </Text>
              </View>
            </Pressable>

            {/* Destination */}
            <Pressable
              accessibilityRole="button"
              disabled={mode === 'BUS' && !selectedBusRoute}
              onPress={() =>
                openPicker(mode === 'METRO' ? 'metro-dest' : 'bus-dest')
              }
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  opacity: mode === 'BUS' && !selectedBusRoute ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name="location" size={16} color={theme.error} />
              <View style={styles.fieldTextCol}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {mode === 'METRO'
                    ? t('journey.destinationStation')
                    : t('journey.destinationStop')}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.fieldValue,
                    {
                      color: (mode === 'METRO' ? destStation : destStop)
                        ? theme.textPrimary
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {mode === 'METRO'
                    ? (destStation?.nameEn ?? t('journey.selectPlaceholder'))
                    : (destStop?.nameEn ?? t('journey.selectPlaceholder'))}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Swap Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('journey.swap')}
            onPress={handleSwap}
            style={[
              styles.swapBtn,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="swap-vertical" size={20} color={theme.primary} />
          </Pressable>
        </View>

        {errorMessage ? (
          <View
            style={[styles.errorBanner, { backgroundColor: theme.errorSoft }]}
          >
            <Ionicons name="alert-circle" size={16} color={theme.error} />
            <Text style={[styles.errorBannerText, { color: theme.error }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {calculating ? (
          <View style={styles.autoCalcRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.autoCalcText, { color: theme.textSecondary }]}>
              {t('journey.calculating')}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Calculated Fare & Route Result */}
      {result ? (
        <View style={styles.resultSection}>
          {/* Fare Summary Card */}
          <Card style={styles.fareCard} contentStyle={styles.fareCardContent}>
            <View style={styles.fareHeaderRow}>
              <View>
                <Text
                  style={[styles.fareCaption, { color: theme.textSecondary }]}
                >
                  {t('journey.estimatedFare')}
                </Text>
                <Text style={[styles.farePrice, { color: theme.primary }]}>
                  {result.fare.amount} {result.fare.currency}
                </Text>
              </View>
              <Badge
                label={
                  result.fare.pricingModel === 'DISTANCE_BASED' &&
                  result.distanceKm !== undefined
                    ? t('journey.distanceBadge', { km: result.distanceKm })
                    : t('journey.fareTier', {
                        min: result.fare.minStops,
                        max: result.fare.maxStops,
                      })
                }
                variant="accent"
                size="sm"
              />
            </View>

            <View
              style={[
                styles.metricsRow,
                { borderTopColor: theme.border, borderBottomColor: theme.border },
              ]}
            >
              <View style={styles.metricChip}>
                <Ionicons
                  name={result.transportType === 'METRO' ? 'subway' : 'bus'}
                  size={15}
                  color={theme.primary}
                />
                <Text
                  style={[styles.metricText, { color: theme.textPrimary }]}
                >
                  {result.transportType === 'METRO'
                    ? t('journey.stationsSummary', { count: result.stopCount })
                    : t('journey.stopsSummary', { count: result.stopCount })}
                </Text>
              </View>

              <View style={styles.metricChip}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={theme.primary}
                />
                <Text
                  style={[styles.metricText, { color: theme.textPrimary }]}
                >
                  {t('journey.estDuration', {
                    minutes: result.estimatedMinutes,
                  })}
                </Text>
              </View>
            </View>

            {/* Transfers Summary */}
            {result.transfers.length === 0 ? (
              <View style={styles.directRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  style={[styles.directText, { color: theme.textSecondary }]}
                >
                  {t('journey.directRoute')}
                </Text>
              </View>
            ) : (
              <View style={styles.transfersList}>
                <Text
                  style={[styles.subHeading, { color: theme.textSecondary }]}
                >
                  {t('journey.transfersTitle')}
                </Text>
                {result.transfers.map((tr) => (
                  <View
                    key={`${tr.stationId}-${tr.toLine.id}`}
                    style={[
                      styles.transferItem,
                      { backgroundColor: theme.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.transferText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {t('journey.transferAt', { station: tr.stationName })}
                    </Text>
                    <View
                      style={[
                        styles.miniPill,
                        { backgroundColor: tr.fromLine.color },
                      ]}
                    >
                      <Text style={styles.miniPillText}>
                        {tr.fromLine.number}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={12}
                      color={theme.textSecondary}
                    />
                    <View
                      style={[
                        styles.miniPill,
                        { backgroundColor: tr.toLine.color },
                      ]}
                    >
                      <Text style={styles.miniPillText}>
                        {tr.toLine.number}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {infoNotice ? (
              <View
                style={[
                  styles.infoBanner,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.infoBannerText, { color: theme.textSecondary }]}
                >
                  {infoNotice}
                </Text>
              </View>
            ) : null}

            <Button
              onPress={() => void handleOpenCheckoutSheet()}
              loading={openingCheckout}
              style={styles.bookBtn}
            >
              {`Pay ${result.fare.amount} ${result.fare.currency}`}
            </Button>
          </Card>

          {/* Collapsible Route Stops Timeline (keeps Pay CTA clean & above the fold) */}
          <Card style={styles.pathCard} contentStyle={styles.pathCardContent}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowStops((prev) => !prev)}
              style={styles.pathToggleRow}
            >
              <Text style={[styles.subHeading, { color: theme.textSecondary, marginBottom: 0 }]}>
                {`${t('journey.routePathTitle')} (${result.path.length})`}
              </Text>
              <Ionicons
                name={showStops ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
            {showStops
              ? result.path.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === result.path.length - 1;
              const lineColor = stop.line?.color ?? theme.primary;
              return (
                <View key={`${stop.id}-${idx}`} style={styles.pathRow}>
                  <View style={styles.pathTrackCol}>
                    <View
                      style={[
                        styles.pathTrackSeg,
                        {
                          backgroundColor: isFirst ? 'transparent' : lineColor,
                        },
                      ]}
                    />
                    <View
                      style={[
                        isFirst || isLast ? styles.pathEndDot : styles.pathDot,
                        { backgroundColor: lineColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.pathTrackSeg,
                        { backgroundColor: isLast ? 'transparent' : lineColor },
                      ]}
                    />
                  </View>
                  <View style={styles.pathStopInfo}>
                    <Text
                      style={[
                        styles.pathStopName,
                        {
                          color: theme.textPrimary,
                          fontWeight: isFirst || isLast ? '700' : '500',
                        },
                      ]}
                    >
                      {stop.order}. {stop.nameEn}
                    </Text>
                    {stop.line ? (
                      <View
                        style={[
                          styles.miniPill,
                          { backgroundColor: stop.line.color },
                        ]}
                      >
                        <Text style={styles.miniPillText}>
                          {stop.line.number}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
              : null}
          </Card>
        </View>
      ) : null}

      {/* Direct In-App Stripe Payment Sheet (auto-redirects to QR Ticket on success) */}
      <StripePaymentSheet
        visible={sheetVisible}
        amount={result?.fare.amount ?? 0}
        currency={result?.fare.currency ?? 'EGP'}
        subtitle={
          result
            ? `${result.origin.nameEn} → ${result.destination.nameEn}`
            : undefined
        }
        processing={paying}
        externalError={sheetError}
        onClose={() => setSheetVisible(false)}
        onCancel={handleCancelPayment}
        onSubmit={handlePayNow}
      />

      {/* Searchable Picker Modal */}
      <Modal
        visible={pickerKind !== null}
        animationType="slide"
        onRequestClose={() => setPickerKind(null)}
      >
        <SafeAreaView
          style={[styles.modalSafe, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {pickerTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerKind(null)}
              style={styles.modalCloseBtn}
            >
              <Text style={[styles.modalCloseText, { color: theme.primary }]}>
                {t('journey.close')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalSearchWrap}>
            <View
              style={[
                styles.modalSearchBox,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder={pickerPlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={[styles.modalSearchInput, { color: theme.textPrimary }]}
                autoCorrect={false}
              />
            </View>
          </View>

          <FlatList
            data={pickerItems as any[]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setErrorMessage(null);
                  setResult(null);
                  if (pickerKind === 'metro-origin') {
                    setOriginStation(item as StationItem);
                  } else if (pickerKind === 'metro-dest') {
                    setDestStation(item as StationItem);
                  } else if (pickerKind === 'bus-route') {
                    setSelectedBusRoute(item as BusRouteSummary);
                    setOriginStop(null);
                    setDestStop(null);
                  } else if (pickerKind === 'bus-origin') {
                    setOriginStop(item as BusStopItem);
                  } else if (pickerKind === 'bus-dest') {
                    setDestStop(item as BusStopItem);
                  }
                  setPickerKind(null);
                }}
                style={[
                  styles.modalRow,
                  {
                    backgroundColor: theme.surface,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={styles.modalRowLeft}>
                  <Text
                    style={[
                      styles.modalRowTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {'code' in item
                      ? `${item.code} — ${item.nameEn}`
                      : item.nameEn}
                  </Text>
                </View>
                {'lines' in item && Array.isArray(item.lines) ? (
                  <View style={styles.modalLinesRow}>
                    {item.lines.map((ln: any) => (
                      <View
                        key={ln.id}
                        style={[
                          styles.miniPill,
                          { backgroundColor: ln.color },
                        ]}
                      >
                        <Text style={styles.miniPillText}>{ln.number}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: spacing.md,
  },
  formCardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  endpointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  endpointsCol: {
    flex: 1,
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldTextCol: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  fieldValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  swapBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.caption,
  },
  autoCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  autoCalcText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.caption,
  },
  resultSection: {
    gap: spacing.md,
  },
  fareCard: {},
  fareCardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  fareHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareCaption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
  },
  farePrice: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  directRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
  },
  transfersList: {
    gap: 6,
  },
  subHeading: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
  },
  transferText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.caption,
  },
  miniPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPillText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: Theme.light.onPrimary,
  },
  bookBtn: {
    marginTop: spacing.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
  },
  pathCard: {},
  pathCardContent: {
    padding: spacing.md,
  },
  pathToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pathRow: {
    flexDirection: 'row',
    minHeight: 36,
  },
  pathTrackCol: {
    width: 22,
    alignItems: 'center',
  },
  pathTrackSeg: {
    flex: 1,
    width: 2.5,
  },
  pathDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pathEndDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pathStopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.xs,
    paddingVertical: 4,
  },
  pathStopName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  modalSearchWrap: {
    padding: spacing.md,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalSearchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  modalList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  modalRowLeft: {
    flex: 1,
    paddingEnd: spacing.sm,
  },
  modalRowTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
  },
  modalLinesRow: {
    flexDirection: 'row',
    gap: 4,
  },
});
