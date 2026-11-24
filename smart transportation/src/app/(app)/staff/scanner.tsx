import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, fontSize, spacing, Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import {
  fetchTicketValidations,
  getStatusErrorKey,
  TicketValidationLogItem,
  TicketValidationResponse,
  validateTicketApi,
  ValidationResultType,
} from '@/lib/transport-api';

type StaffTab = 'SCAN' | 'HISTORY';

export default function StaffScannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [activeTab, setActiveTab] = useState<StaffTab>('SCAN');
  const [torchOn, setTorchOn] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [validating, setValidating] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TicketValidationResponse | null>(
    null
  );

  const [logs, setLogs] = useState<TicketValidationLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  const isStaff =
    user?.role === 'STATION_EMPLOYEE' || user?.role === 'ADMIN';

  const loadLogs = useCallback(async () => {
    if (!token || !isStaff) return;
    setLoadingLogs(true);
    try {
      const data = await fetchTicketValidations(token);
      setLogs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
    } finally {
      setLoadingLogs(false);
      setRefreshingLogs(false);
    }
  }, [token, isStaff, logout]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const submitValidation = async (payload: {
    qrPayload?: string;
    ticketCode?: string;
  }) => {
    if (!token || validating) return;
    setScanLocked(true);
    setValidating(true);
    setScanError(null);
    try {
      const res = await validateTicketApi(payload, token);
      if (res.ticket?.ticketCode) {
        setManualCode(res.ticket.ticketCode);
      }
      setLastResult(res);
      void loadLogs();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
      const key = getStatusErrorKey(err);
      setScanError(
        key === 'errors.networkError'
          ? 'Network error. Please check your connection and try again.'
          : 'Could not validate ticket. Please try again.'
      );
      setScanLocked(false);
    } finally {
      setValidating(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLocked || validating || !data?.trim()) return;
    const raw = data.trim();
    if (raw.startsWith('ST1.')) {
      const parts = raw.split('.');
      if (parts[1]) {
        setManualCode(parts[1]);
      }
      void submitValidation({ qrPayload: raw });
    } else {
      setManualCode(raw.toUpperCase());
      void submitValidation({ ticketCode: raw });
    }
  };

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) {
      setScanError('Enter a ticket code (e.g. ST-A1B2C3D4).');
      return;
    }
    if (trimmed.startsWith('ST1.')) {
      void submitValidation({ qrPayload: trimmed });
    } else {
      void submitValidation({ ticketCode: trimmed });
    }
  };

  const handleCloseResult = () => {
    setLastResult(null);
    setManualCode('');
    setScanLocked(false);
  };

  const getResultVisuals = (result: ValidationResultType) => {
    switch (result) {
      case 'VALID':
        return {
          icon: 'checkmark-circle' as const,
          color: '#16A34A',
          bg: '#DCFCE7',
          title: 'Valid Ticket',
          badgeVariant: 'success' as const,
        };
      case 'ALREADY_USED':
        return {
          icon: 'alert-circle' as const,
          color: '#D97706',
          bg: '#FEF3C7',
          title: 'Already Used',
          badgeVariant: 'neutral' as const,
        };
      case 'EXPIRED':
        return {
          icon: 'time' as const,
          color: '#EA580C',
          bg: '#FFEDD5',
          title: 'Ticket Expired',
          badgeVariant: 'neutral' as const,
        };
      default:
        return {
          icon: 'close-circle' as const,
          color: '#DC2626',
          bg: '#FEE2E2',
          title: 'Invalid Ticket',
          badgeVariant: 'neutral' as const,
        };
    }
  };

  if (!isStaff) {
    return (
      <Screen contentContainerStyle={styles.container}>
        <ScreenHeader
          title="Staff Scanner"
          subtitle="Authorized station personnel only"
        />
        <Card contentStyle={styles.restrictedCard}>
          <View style={styles.restrictedIcon}>
            <Ionicons name="shield-outline" size={30} color={theme.primary} />
          </View>
          <Text style={[styles.restrictedTitle, { color: theme.textPrimary }]}>
            Station Staff Access Required
          </Text>
          <Text style={[styles.restrictedSub, { color: theme.textSecondary }]}>
            Sign in with a Station Employee or Admin account to validate
            passenger QR tickets.
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </Card>
      </Screen>
    );
  }

  const resultVisual = lastResult ? getResultVisuals(lastResult.result) : null;

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        contentContainerStyle={styles.container}
        refreshControl={
          activeTab === 'HISTORY' ? (
            <RefreshControl
              refreshing={refreshingLogs}
              onRefresh={() => {
                setRefreshingLogs(true);
                void loadLogs();
              }}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          ) : undefined
        }
      >
        <ScreenHeader
          title="Ticket Scanner"
          subtitle="Scan passenger QR pass or enter code"
        />

        {/* Segmented Switcher: Scanner | Recent Scans */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {(
            [
              { key: 'SCAN', label: 'QR Scanner' },
              { key: 'HISTORY', label: `Recent Scans (${logs.length})` },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabBtn,
                  selected && { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: selected
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

        {activeTab === 'SCAN' ? (
          <View style={styles.scanSection}>
            {/* Camera Viewfinder Card */}
            <View
              style={[
                styles.cameraCard,
                { backgroundColor: '#0F172A', borderColor: theme.border },
              ]}
            >
              {Platform.OS === 'web' ? (
                <View style={styles.permissionBox}>
                  <Ionicons name="qr-code-outline" size={34} color="#94A3B8" />
                  <Text style={styles.permissionTitle}>
                    Camera unavailable on Web
                  </Text>
                  <Text style={styles.permissionSub}>
                    Use Expo Go on your phone for live QR scanning, or enter the
                    ticket code below.
                  </Text>
                </View>
              ) : !permission ? (
                <View style={styles.permissionBox}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : !permission.granted ? (
                <View style={styles.permissionBox}>
                  <Ionicons name="camera-outline" size={36} color="#FFFFFF" />
                  <Text style={styles.permissionTitle}>
                    Camera access needed
                  </Text>
                  <Text style={styles.permissionSub}>
                    Allow camera access to scan passenger QR boarding passes.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void requestPermission()}
                    style={[
                      styles.grantBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.grantBtnText}>Enable Camera</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cameraWrap}>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    enableTorch={torchOn}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={
                      scanLocked || validating
                        ? undefined
                        : handleBarcodeScanned
                    }
                  />
                  {/* Viewfinder Overlay */}
                  <View pointerEvents="box-none" style={styles.cameraOverlay}>
                    <View style={styles.cameraTopBar}>
                      <View style={styles.livePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>
                          {validating ? 'Validating...' : 'Ready to scan'}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Toggle flashlight"
                        onPress={() => setTorchOn((prev) => !prev)}
                        style={styles.torchBtn}
                      >
                        <Ionicons
                          name={torchOn ? 'flash' : 'flash-outline'}
                          size={18}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    </View>

                    <View style={styles.reticleBox}>
                      <View style={[styles.corner, styles.cornerTL]} />
                      <View style={[styles.corner, styles.cornerTR]} />
                      <View style={[styles.corner, styles.cornerBL]} />
                      <View style={[styles.corner, styles.cornerBR]} />
                    </View>

                    <Text style={styles.cameraHint}>
                      Align the passenger QR code inside the frame
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Manual Ticket Code Fallback (for 1-phone testing or cracked screens) */}
            <Card contentStyle={styles.manualCardBody}>
              <Text style={[styles.manualLabel, { color: theme.textSecondary }]}>
                MANUAL TICKET CODE
              </Text>
              <View style={styles.manualRow}>
                <TextInput
                  value={manualCode}
                  onChangeText={(val) => {
                    setManualCode(val);
                    setScanError(null);
                  }}
                  placeholder="e.g. ST-A1B2C3D4"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.manualInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={validating}
                  onPress={handleManualSubmit}
                  style={({ pressed }) => [
                    styles.manualSubmitBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: validating ? 0.6 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {validating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.manualSubmitText}>Verify</Text>
                  )}
                </Pressable>
              </View>
              {scanError ? (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {scanError}
                </Text>
              ) : null}
            </Card>
          </View>
        ) : (
          /* Recent Scans History */
          <View style={styles.historySection}>
            {loadingLogs && logs.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : logs.length === 0 ? (
              <Card contentStyle={styles.emptyCard}>
                <Ionicons
                  name="scan-outline"
                  size={30}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.emptyTitle, { color: theme.textPrimary }]}
                >
                  No scans yet
                </Text>
                <Text
                  style={[styles.emptySub, { color: theme.textSecondary }]}
                >
                  Validated tickets will appear here with their status and time.
                </Text>
              </Card>
            ) : (
              logs.map((log) => {
                const vis = getResultVisuals(log.result);
                return (
                  <Card key={log.id} contentStyle={styles.logCard}>
                    <View style={styles.logTop}>
                      <View
                        style={[
                          styles.logIconCircle,
                          { backgroundColor: vis.bg },
                        ]}
                      >
                        <Ionicons name={vis.icon} size={18} color={vis.color} />
                      </View>
                      <View style={styles.logMain}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.logTitle,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {log.ticket
                            ? `${log.ticket.booking.originName} → ${log.ticket.booking.destinationName}`
                            : log.scannedCode}
                        </Text>
                        <Text
                          style={[
                            styles.logSub,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {log.ticket
                            ? `${log.ticket.ticketCode} · ${log.ticket.booking.passengerName}`
                            : (log.notes ?? 'Unknown code')}
                        </Text>
                      </View>
                      <Badge
                        label={log.result.replace('_', ' ')}
                        variant={vis.badgeVariant}
                        size="sm"
                      />
                    </View>
                    <Text style={[styles.logTime, { color: theme.textSecondary }]}>
                      {new Date(log.validatedAt).toLocaleString()}
                    </Text>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </Screen>

      {/* Centered Validation Result Dialog */}
      <Modal
        visible={Boolean(lastResult)}
        transparent
        animationType="fade"
        onRequestClose={handleCloseResult}
      >
        <View style={styles.resultOverlay}>
          <Pressable style={styles.resultBackdrop} onPress={handleCloseResult} />
          {lastResult && resultVisual ? (
            <View style={styles.resultDialog}>
              <View
                style={[
                  styles.resultIconCircle,
                  { backgroundColor: resultVisual.bg },
                ]}
              >
                <Ionicons
                  name={resultVisual.icon}
                  size={34}
                  color={resultVisual.color}
                />
              </View>

              <Text style={styles.resultTitle}>{resultVisual.title}</Text>
              <Text style={styles.resultMessage}>{lastResult.message}</Text>

              {lastResult.ticket ? (
                <View style={styles.resultDetailBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Passenger</Text>
                    <Text style={styles.detailValue}>
                      {lastResult.ticket.booking.passengerName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route</Text>
                    <Text numberOfLines={1} style={styles.detailValue}>
                      {lastResult.ticket.booking.originName} →{' '}
                      {lastResult.ticket.booking.destinationName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ticket Code</Text>
                    <Text style={styles.detailValue}>
                      {lastResult.ticket.ticketCode}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fare</Text>
                    <Text style={styles.detailValue}>
                      {lastResult.ticket.booking.totalAmount}{' '}
                      {lastResult.ticket.booking.currency}
                    </Text>
                  </View>
                  {lastResult.ticket.usedAt ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Used At</Text>
                      <Text style={styles.detailValue}>
                        {new Date(lastResult.ticket.usedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleCloseResult}
                style={({ pressed }) => [
                  styles.resultDoneBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.resultDoneText}>Scan Next Ticket</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingBottom: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  scanSection: {
    gap: spacing.md,
  },
  cameraCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    height: 330,
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cameraTopBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  liveText: {
    color: '#F8FAFC',
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: 190,
    height: 190,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },
  cameraHint: {
    color: '#F8FAFC',
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionSub: {
    color: '#CBD5E1',
    fontFamily: fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  grantBtn: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  manualCardBody: {
    padding: spacing.md,
    gap: 10,
  },
  manualLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  manualSubmitBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  manualSubmitText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
  },
  historySection: {
    gap: spacing.sm,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  logCard: {
    padding: spacing.md,
    gap: 8,
  },
  logTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logMain: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  logSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  logTime: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
  restrictedCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  restrictedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  restrictedTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  restrictedSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  resultBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  resultDialog: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
  },
  resultIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  resultMessage: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultDetailBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: '#64748B',
  },
  detailValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
    textAlign: 'right',
  },
  resultDoneBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDoneText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 14.5,
    fontWeight: '600',
  },
});
