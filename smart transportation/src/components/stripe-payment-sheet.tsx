import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily } from '@/constants/theme';
import { StripeTestCardToken, TestPaymentOutcome } from '@/lib/transport-api';

// Official Stripe Test Mode cards mapped to Stripe's official test PaymentMethod tokens
const STRIPE_TEST_CARD_MAP: Record<
  string,
  { outcome: TestPaymentOutcome; token: StripeTestCardToken }
> = {
  '4242424242424242': { outcome: 'SUCCEEDED', token: 'pm_card_visa' },
  '4000056655665556': { outcome: 'SUCCEEDED', token: 'pm_card_visa' },
  '5555555555554444': { outcome: 'SUCCEEDED', token: 'pm_card_mastercard' },
  '2223003122003104': { outcome: 'SUCCEEDED', token: 'pm_card_mastercard' },
  '4000000000000002': { outcome: 'FAILED', token: 'pm_card_chargeDeclined' },
  '4000000000009995': {
    outcome: 'FAILED',
    token: 'pm_card_chargeDeclinedInsufficientFunds',
  },
  '4000000000000069': {
    outcome: 'FAILED',
    token: 'pm_card_chargeDeclinedExpiredCard',
  },
  '4000000000000127': { outcome: 'FAILED', token: 'pm_card_cvcCheckFail' },
};

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  }
  return digits;
}

function detectCardBrand(digits: string): 'VISA' | 'MC' | 'AMEX' | null {
  if (digits.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'MC';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return null;
}

function passesLuhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export interface StripePaymentSheetProps {
  visible: boolean;
  amount: number;
  currency: string;
  subtitle?: string;
  processing: boolean;
  externalError?: string | null;
  onClose: () => void;
  onCancel?: () => Promise<void> | void;
  onSubmit: (
    outcome: TestPaymentOutcome,
    paymentMethodToken: StripeTestCardToken
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function StripePaymentSheet({
  visible,
  amount,
  currency,
  subtitle,
  processing,
  externalError,
  onClose,
  onCancel,
  onSubmit,
}: StripePaymentSheetProps) {
  const theme = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [focusedField, setFocusedField] = useState<'card' | 'exp' | 'cvc' | null>(null);
  const [errorField, setErrorField] = useState<'card' | 'exp' | 'cvc' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Reset inline cancel confirmation whenever sheet opens/closes
  useEffect(() => {
    if (!visible) {
      setConfirmingCancel(false);
      setLocalError(null);
      setErrorField(null);
    }
  }, [visible]);

  const busy = processing || cancelling;
  const rawCardDigits = cardNumber.replace(/\D/g, '');
  const cardBrand = detectCardBrand(rawCardDigits);
  const displayError = localError || externalError;

  const executeCancel = async () => {
    if (busy) return;
    setLocalError(null);
    setErrorField(null);
    if (onCancel) {
      setCancelling(true);
      try {
        await onCancel();
      } finally {
        setCancelling(false);
        setConfirmingCancel(false);
      }
    } else {
      setConfirmingCancel(false);
      onClose();
    }
  };

  const handlePay = async () => {
    setLocalError(null);
    setErrorField(null);

    if (rawCardDigits.length < 15 || !passesLuhnCheck(rawCardDigits)) {
      setErrorField('card');
      setLocalError('Card number is incomplete or invalid.');
      return;
    }

    const expDigits = expiry.replace(/\D/g, '');
    if (expDigits.length !== 4) {
      setErrorField('exp');
      setLocalError('Enter a valid expiration date (MM / YY).');
      return;
    }
    const expMonth = Number(expDigits.slice(0, 2));
    const expYear = 2000 + Number(expDigits.slice(2, 4));
    if (expMonth < 1 || expMonth > 12) {
      setErrorField('exp');
      setLocalError('Expiration month must be between 01 and 12.');
      return;
    }
    const now = new Date();
    if (
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
    ) {
      setErrorField('exp');
      setLocalError('Your card has expired.');
      return;
    }

    if (cvc.replace(/\D/g, '').length < 3) {
      setErrorField('cvc');
      setLocalError('Enter a valid 3-digit security code.');
      return;
    }

    // Resolve Stripe Test Mode PaymentMethod token & let Stripe's API authorize or decline
    const mapped = STRIPE_TEST_CARD_MAP[rawCardDigits] ?? {
      outcome: 'FAILED' as const,
      token: 'pm_card_chargeDeclined' as const,
    };

    const res = await onSubmit(mapped.outcome, mapped.token);
    if (res.ok) {
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setLocalError(null);
      setErrorField(null);
    } else {
      setErrorField('card');
      setLocalError(
        res.error || 'Your card was declined by Stripe. Please try another card.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!busy) onClose();
          }}
        />

        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Top Drag Pill */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Payment
              </Text>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>TEST</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close payment sheet"
              disabled={busy}
              onPress={onClose}
              style={[styles.closeCircle, { backgroundColor: theme.surfaceAlt }]}
            >
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </Pressable>
          </View>

          {/* Compact Order Summary Strip */}
          <View
            style={[
              styles.summaryStrip,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <View style={styles.summaryLeft}>
              <Text
                numberOfLines={1}
                style={[styles.summaryRoute, { color: theme.textPrimary }]}
              >
                {subtitle ?? 'Transit Ticket'}
              </Text>
              <View style={styles.securedRow}>
                <Ionicons
                  name="lock-closed"
                  size={11}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.securedText, { color: theme.textSecondary }]}
                >
                  Secured by Stripe
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.amountPill,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Text style={[styles.amountText, { color: theme.primary }]}>
                {amount} {currency}
              </Text>
            </View>
          </View>

          {/* Card Details Section */}
          <Text style={[styles.fieldGroupLabel, { color: theme.textSecondary }]}>
            CARD DETAILS
          </Text>

          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: theme.surface,
                borderColor: errorField
                  ? theme.error
                  : focusedField
                    ? theme.primary
                    : theme.border,
              },
            ]}
          >
            {/* Card Number Row */}
            <View
              style={[
                styles.cardNumberRow,
                { borderBottomColor: theme.border },
              ]}
            >
              <Ionicons
                name="card-outline"
                size={19}
                color={focusedField === 'card' ? theme.primary : theme.textSecondary}
                style={styles.leadingIcon}
              />
              <TextInput
                value={cardNumber}
                onFocus={() => setFocusedField('card')}
                onBlur={() => setFocusedField(null)}
                onChangeText={(txt) => {
                  setLocalError(null);
                  setCardNumber(formatCardNumber(txt));
                }}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={19}
                style={[styles.input, { color: theme.textPrimary }]}
              />
              {cardBrand ? (
                <View
                  style={[
                    styles.brandPill,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.brandPillText}>{cardBrand}</Text>
                </View>
              ) : (
                <View style={styles.brandGhostRow}>
                  <Text style={styles.brandGhostText}>VISA</Text>
                  <Text style={styles.brandGhostText}>MC</Text>
                </View>
              )}
            </View>

            {/* Expiry & CVC Split Row */}
            <View style={styles.splitRow}>
              <View
                style={[
                  styles.halfCell,
                  styles.halfCellLeft,
                  { borderRightColor: theme.border },
                ]}
              >
                <TextInput
                  value={expiry}
                  onFocus={() => setFocusedField('exp')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(txt) => {
                    setLocalError(null);
                    setExpiry(formatExpiry(txt));
                  }}
                  placeholder="MM / YY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={7}
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
              <View style={styles.halfCell}>
                <TextInput
                  value={cvc}
                  onFocus={() => setFocusedField('cvc')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(txt) => {
                    setLocalError(null);
                    setCvc(txt.replace(/\D/g, '').slice(0, 4));
                  }}
                  placeholder="CVC"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  style={[styles.input, { color: theme.textPrimary }]}
                />
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Inline Error Banner */}
          {displayError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.errorSoft },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {displayError}
              </Text>
            </View>
          ) : null}

          {/* Primary Pay CTA */}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handlePay()}
            style={({ pressed }) => [
              styles.payBtn,
              {
                backgroundColor: theme.primary,
                opacity: busy ? 0.72 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
                <Text style={styles.payBtnText}>
                  Pay {amount} {currency}
                </Text>
              </>
            )}
          </Pressable>

          {/* Cancel Payment Action */}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setConfirmingCancel(true)}
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: busy ? 0.5 : pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
              Cancel payment
            </Text>
          </Pressable>
        </View>

        {/* Centered Cancel Confirmation Dialog (identical style to Journey screen) */}
        {confirmingCancel ? (
          <View style={styles.confirmOverlay}>
            <Pressable
              style={styles.confirmBackdrop}
              onPress={() => {
                if (!busy) setConfirmingCancel(false);
              }}
            />
            <View style={styles.confirmDialog}>
              <View style={styles.confirmIconCircle}>
                <Ionicons name="alert-circle" size={26} color="#DC2626" />
              </View>
              <Text style={styles.confirmTitle}>Cancel payment?</Text>
              <Text style={styles.confirmMessage}>
                Your pending reservation will be cancelled and no charge will be made.
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => setConfirmingCancel(false)}
                  style={({ pressed }) => [
                    styles.confirmKeepBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={styles.confirmKeepText}>Keep</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void executeCancel()}
                  style={({ pressed }) => [
                    styles.confirmCancelBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmCancelText}>Yes, cancel</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  testBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testBadgeText: {
    color: '#92400E',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    gap: 10,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryRoute: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  securedText: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
  amountPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  amountText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
  },
  fieldGroupLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  cardBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  leadingIcon: {
    marginEnd: 10,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  halfCellLeft: {
    borderRightWidth: 1,
  },
  input: {
    flex: 1,
    height: 50,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
  brandPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandPillText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '800',
  },
  brandGhostRow: {
    flexDirection: 'row',
    gap: 5,
  },
  brandGhostText: {
    color: '#9CA3AF',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
  },
  payBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    fontWeight: '600',
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  confirmIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmMessage: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmKeepBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmKeepText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
});
