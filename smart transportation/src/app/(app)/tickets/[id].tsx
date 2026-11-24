import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { StripePaymentSheet } from '@/components/stripe-payment-sheet';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import {
  BookingRecord,
  confirmBookingPayment,
  fetchBookingById,
  getStatusErrorKey,
  StripeTestCardToken,
  TestPaymentOutcome,
} from '@/lib/transport-api';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { token, logout } = useAuth();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await fetchBookingById(id, token);
      setBooking(data);
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
    }
  }, [token, id, logout, t]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const handlePaySubmit = async (
    outcome: TestPaymentOutcome,
    paymentMethodToken: StripeTestCardToken
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!token || !id) return { ok: false };
    setPaying(true);
    setSheetError(null);
    try {
      const updated = await confirmBookingPayment(
        id,
        outcome,
        token,
        paymentMethodToken
      );
      setBooking(updated);
      if (updated.status === 'CONFIRMED') {
        setSheetVisible(false);
        return { ok: true };
      }
      return {
        ok: false,
        error:
          updated.failureReason ||
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

  const handleCancelBooking = async () => {
    if (!token || !id) return;
    setPaying(true);
    try {
      const updated = await confirmBookingPayment(id, 'CANCELLED', token);
      setBooking(updated);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
      const key = getStatusErrorKey(err);
      setError(t(key as any) as string);
    } finally {
      setPaying(false);
    }
  };

  const isPayable =
    booking?.status === 'PENDING' || booking?.status === 'FAILED';
  const isConfirmed = booking?.status === 'CONFIRMED' && Boolean(booking.ticket);

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <ScreenHeader
        title={isConfirmed ? 'Boarding Pass' : isPayable ? 'Checkout' : t('tickets.detailTitle')}
      />

      {loading ? (
        <Card contentStyle={styles.cardBody}>
          <Skeleton width="60%" height={22} borderRadius={4} />
          <Skeleton width="40%" height={16} borderRadius={4} />
          <Skeleton width="100%" height={240} borderRadius={12} />
        </Card>
      ) : error && !booking ? (
        <Card contentStyle={styles.centeredCard}>
          <Ionicons name="alert-circle" size={28} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            {error}
          </Text>
          <Button variant="secondary" onPress={() => void loadBooking()}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      ) : booking ? (
        <View style={styles.contentWrap}>
          {/* CONFIRMED -> Apple-Wallet style Boarding Pass */}
          {isConfirmed && booking.ticket ? (
            <>
              <View
                style={[
                  styles.passCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Branded Pass Header (unified with app primary theme) */}
                <View
                  style={[styles.passHeader, { backgroundColor: theme.primary }]}
                >
                  <View style={styles.passHeaderTop}>
                    <View style={styles.passModeBadge}>
                      <Ionicons
                        name={booking.transportType === 'METRO' ? 'subway' : 'bus'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.passModeText}>
                        {booking.transportType === 'METRO'
                          ? 'CAIRO METRO'
                          : (booking.busRoute?.code ?? 'CAIRO BUS')}
                      </Text>
                    </View>
                    <View style={styles.passStatusPill}>
                      <Text style={styles.passStatusText}>
                        {booking.ticket.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.passRouteRow}>
                    <View style={styles.passEndpoint}>
                      <Text style={styles.passEndpointLabel}>FROM</Text>
                      <Text numberOfLines={2} style={styles.passEndpointName}>
                        {booking.originName}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#A7F3D0"
                      style={styles.passArrow}
                    />
                    <View style={[styles.passEndpoint, styles.passEndpointRight]}>
                      <Text style={styles.passEndpointLabel}>TO</Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.passEndpointName, styles.textRight]}
                      >
                        {booking.destinationName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Perforated Divider with Side Notches */}
                <View style={styles.perforationRow}>
                  <View
                    style={[
                      styles.notchLeft,
                      { backgroundColor: theme.background },
                    ]}
                  />
                  <View
                    style={[styles.dashedLine, { borderColor: theme.border }]}
                  />
                  <View
                    style={[
                      styles.notchRight,
                      { backgroundColor: theme.background },
                    ]}
                  />
                </View>

                {/* QR Code & Details Body */}
                <View style={styles.passBody}>
                  {booking.ticket.qrImageDataUrl ? (
                    <View style={styles.qrFrame}>
                      <Image
                        source={{ uri: booking.ticket.qrImageDataUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}

                  <Text
                    style={[styles.qrCaption, { color: theme.textSecondary }]}
                  >
                    Scan at station gate or show to ticket inspector
                  </Text>

                  <View
                    style={[styles.metaGrid, { borderTopColor: theme.border }]}
                  >
                    <View style={styles.metaCell}>
                      <Text
                        style={[styles.metaLabel, { color: theme.textSecondary }]}
                      >
                        TICKET CODE
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: theme.textPrimary }]}
                      >
                        {booking.ticket.ticketCode}
                      </Text>
                    </View>
                    <View style={[styles.metaCell, styles.metaCellRight]}>
                      <Text
                        style={[styles.metaLabel, { color: theme.textSecondary }]}
                      >
                        FARE PAID
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: theme.primary }]}
                      >
                        {booking.totalAmount} {booking.currency}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaGridBottom}>
                    <View style={styles.metaCell}>
                      <Text
                        style={[styles.metaLabel, { color: theme.textSecondary }]}
                      >
                        STOPS
                      </Text>
                      <Text
                        style={[styles.metaValueSmall, { color: theme.textPrimary }]}
                      >
                        {booking.transportType === 'METRO'
                          ? `${booking.stopCount} stations`
                          : booking.distanceKm !== null
                            ? `${booking.stopCount} stops • ${booking.distanceKm} km`
                            : `${booking.stopCount} stops`}
                      </Text>
                    </View>
                    <View style={[styles.metaCell, styles.metaCellRight]}>
                      <Text
                        style={[styles.metaLabel, { color: theme.textSecondary }]}
                      >
                        VALID UNTIL
                      </Text>
                      <Text
                        style={[styles.metaValueSmall, { color: theme.textPrimary }]}
                      >
                        {new Date(booking.ticket.expiresAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Clean Post-Booking Navigation Actions */}
              <View style={styles.doneActions}>
                <Button onPress={() => router.replace('/(app)/(tabs)' as any)}>
                  Back to Home
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => router.replace('/tickets' as any)}
                >
                  View All Tickets
                </Button>
              </View>
            </>
          ) : null}

          {/* PENDING / FAILED -> Clean Retry Checkout */}
          {isPayable ? (
            <>
              <Card contentStyle={styles.cardBody}>
                <View style={styles.topRow}>
                  <Badge label={booking.status} variant="neutral" size="sm" />
                  <Text style={[styles.priceTop, { color: theme.primary }]}>
                    {booking.totalAmount} {booking.currency}
                  </Text>
                </View>
                <Text style={[styles.routeTitle, { color: theme.textPrimary }]}>
                  {booking.originName} → {booking.destinationName}
                </Text>
                <Text style={[styles.routeSub, { color: theme.textSecondary }]}>
                  {booking.stopCount}{' '}
                  {booking.transportType === 'METRO' ? 'stations' : 'stops'}
                </Text>
              </Card>

              <View style={styles.doneActions}>
                <Button
                  onPress={() => {
                    setSheetError(null);
                    setSheetVisible(true);
                  }}
                >
                  {`Pay ${booking.totalAmount} ${booking.currency}`}
                </Button>
                <Pressable
                  accessibilityRole="button"
                  disabled={paying}
                  onPress={() => void handleCancelBooking()}
                  style={styles.cancelLink}
                >
                  <Text
                    style={[styles.cancelText, { color: theme.textSecondary }]}
                  >
                    Cancel booking
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {/* CANCELLED */}
          {booking.status === 'CANCELLED' ? (
            <Card contentStyle={styles.centeredCard}>
              <Ionicons
                name="close-circle-outline"
                size={34}
                color={theme.textSecondary}
              />
              <Text style={[styles.errorText, { color: theme.textPrimary }]}>
                {t('tickets.paymentCancelledNotice')}
              </Text>
              <Button
                variant="secondary"
                onPress={() => router.replace('/journey' as any)}
              >
                Plan another journey
              </Button>
            </Card>
          ) : null}
        </View>
      ) : null}

      <StripePaymentSheet
        visible={sheetVisible}
        amount={booking?.totalAmount ?? 0}
        currency={booking?.currency ?? 'EGP'}
        subtitle={
          booking ? `${booking.originName} → ${booking.destinationName}` : undefined
        }
        processing={paying}
        externalError={sheetError}
        onClose={() => setSheetVisible(false)}
        onCancel={async () => {
          setSheetVisible(false);
          await handleCancelBooking();
        }}
        onSubmit={handlePaySubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  contentWrap: {
    gap: spacing.md,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  centeredCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTop: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontWeight: '800',
  },
  routeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    fontWeight: '700',
    marginTop: 4,
  },
  routeSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
  },
  errorText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    textAlign: 'center',
  },

  // --- Boarding Pass Card ---
  passCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  passHeader: {
    padding: 18,
    gap: 14,
  },
  passHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  passModeText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  passStatusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  passStatusText: {
    color: '#065F46',
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    fontWeight: '800',
  },
  passRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  passEndpoint: {
    flex: 1,
  },
  passEndpointRight: {
    alignItems: 'flex-end',
  },
  passEndpointLabel: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  passEndpointName: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  textRight: {
    textAlign: 'right',
  },
  passArrow: {
    marginTop: 12,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginVertical: -11,
    zIndex: 2,
  },
  notchLeft: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
  },
  notchRight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: -11,
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    marginHorizontal: 6,
  },
  passBody: {
    padding: 18,
    paddingTop: 22,
    alignItems: 'center',
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  qrCaption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  metaGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  metaGridBottom: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCell: {
    flex: 1,
  },
  metaCellRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
  },
  metaValueSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  doneActions: {
    gap: spacing.sm,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.caption,
  },
});
