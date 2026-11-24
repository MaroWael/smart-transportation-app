// ---------------------------------------------------------------
// Smart Transportation — Stripe Test Mode Service
// ---------------------------------------------------------------
// Uses the official Stripe SDK in Test Mode when STRIPE_SECRET_KEY
// (sk_test_...) is provided. Falls back to a deterministic local
// Stripe Test Mode simulator when no key is configured so local
// development and automated tests work seamlessly without real money.
// ---------------------------------------------------------------

import crypto from 'crypto';
import Stripe from 'stripe';
import { env } from '../config/env';

export type TestPaymentOutcome = 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export type StripeTestCardToken =
  | 'pm_card_visa'
  | 'pm_card_mastercard'
  | 'pm_card_chargeDeclined'
  | 'pm_card_chargeDeclinedInsufficientFunds'
  | 'pm_card_chargeDeclinedExpiredCard'
  | 'pm_card_cvcCheckFail';

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  mode: 'stripe_test_api' | 'stripe_test_simulator';
}

export interface ConfirmTestPaymentResult {
  paymentIntentId: string;
  outcome: TestPaymentOutcome;
  mode: 'stripe_test_api' | 'stripe_test_simulator';
  failureReason?: string;
}

const stripeClient =
  env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_test_')
    ? new Stripe(env.STRIPE_SECRET_KEY)
    : null;

export async function createTestPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>
): Promise<PaymentIntentResult> {
  if (stripeClient) {
    let intent: Stripe.PaymentIntent;
    try {
      intent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata,
      });
    } catch (err: any) {
      const msg = String(err?.message ?? '');
      if (
        currency.toUpperCase() === 'EGP' &&
        (err?.code === 'amount_too_small' || /at least|minimum|50 cents/i.test(msg))
      ) {
        const usdCents = Math.max(100, Math.round((amount / 50) * 100));
        intent = await stripeClient.paymentIntents.create({
          amount: usdCents,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          metadata: {
            ...metadata,
            originalAmount: String(amount),
            originalCurrency: currency,
          },
        });
      } else {
        throw err;
      }
    }

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret ?? `${intent.id}_secret_test`,
      mode: 'stripe_test_api',
    };
  }

  // Deterministic Stripe Test Mode simulator
  const rand = crypto.randomBytes(12).toString('hex');
  const paymentIntentId = `pi_test_${rand}`;
  const secretRand = crypto.randomBytes(12).toString('hex');
  return {
    paymentIntentId,
    clientSecret: `${paymentIntentId}_secret_${secretRand}`,
    mode: 'stripe_test_simulator',
  };
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  mode: 'stripe_test_api' | 'stripe_test_simulator';
}

export interface VerifyCheckoutSessionResult {
  sessionId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'CANCELLED';
  paymentIntentId?: string;
}

export function isRealStripeConfigured(): boolean {
  return Boolean(stripeClient);
}

export async function createTestCheckoutSession(params: {
  bookingId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResult> {
  if (!stripeClient) {
    throw new Error(
      'STRIPE_SECRET_KEY (sk_test_...) is not configured in backend/.env'
    );
  }

  const createSession = async (currency: string, unitAmount: number, label: string) =>
    stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: label,
              description: params.description,
            },
          },
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        bookingId: params.bookingId,
        originalAmount: String(params.amount),
        originalCurrency: params.currency,
      },
    });

  let session: Stripe.Checkout.Session;
  try {
    // Attempt charging in original currency (e.g. EGP)
    session = await createSession(
      params.currency,
      Math.round(params.amount * 100),
      params.title
    );
  } catch (err: any) {
    // Stripe enforces a ~$0.50 USD minimum (~25-30 EGP). For smaller transit fares (e.g. 10-20 EGP),
    // seamlessly fall back to a $1.00 USD test charge while displaying the exact EGP fare on the receipt.
    const msg = String(err?.message ?? '');
    if (
      params.currency.toUpperCase() === 'EGP' &&
      (err?.code === 'amount_too_small' || /at least|minimum|50 cents/i.test(msg))
    ) {
      const usdCents = Math.max(100, Math.round((params.amount / 50) * 100));
      session = await createSession(
        'usd',
        usdCents,
        `${params.title} (${params.amount} ${params.currency})`
      );
    } else {
      throw err;
    }
  }

  if (!session.url) {
    throw new Error('Stripe Checkout did not return a checkout URL');
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    mode: 'stripe_test_api',
  };
}

export async function verifyTestCheckoutSession(
  sessionId: string
): Promise<VerifyCheckoutSessionResult> {
  if (!stripeClient) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid') {
    return {
      sessionId: session.id,
      status: 'SUCCEEDED',
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
    };
  }

  if (session.status === 'expired') {
    return {
      sessionId: session.id,
      status: 'CANCELLED',
    };
  }

  return {
    sessionId: session.id,
    status: 'PENDING',
  };
}

export async function confirmTestPaymentIntent(
  paymentIntentId: string,
  requestedOutcome: TestPaymentOutcome,
  paymentMethodToken?: StripeTestCardToken
): Promise<ConfirmTestPaymentResult> {
  if (stripeClient && !paymentIntentId.startsWith('pi_test_')) {
    if (requestedOutcome === 'CANCELLED') {
      try {
        await stripeClient.paymentIntents.cancel(paymentIntentId);
      } catch (err: any) {
        // Ignore if Stripe PaymentIntent was already cancelled
        if (err?.code !== 'payment_intent_unexpected_state') {
          throw err;
        }
      }
      return {
        paymentIntentId,
        outcome: 'CANCELLED',
        mode: 'stripe_test_api',
      };
    }

    const token: StripeTestCardToken =
      paymentMethodToken ??
      (requestedOutcome === 'FAILED'
        ? 'pm_card_chargeDeclined'
        : 'pm_card_visa');

    try {
      const confirmed = await stripeClient.paymentIntents.confirm(
        paymentIntentId,
        { payment_method: token }
      );

      return {
        paymentIntentId,
        outcome: confirmed.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED',
        mode: 'stripe_test_api',
      };
    } catch (err: any) {
      const rawMsg =
        err?.raw?.message ||
        (err instanceof Error ? err.message : 'Your card was declined.');
      return {
        paymentIntentId,
        outcome: 'FAILED',
        mode: 'stripe_test_api',
        failureReason: rawMsg,
      };
    }
  }

  // Built-in Stripe Test Mode simulator
  if (requestedOutcome === 'FAILED') {
    const simulatedReasons: Record<string, string> = {
      pm_card_chargeDeclinedInsufficientFunds: 'Your card has insufficient funds.',
      pm_card_chargeDeclinedExpiredCard: 'Your card has expired.',
      pm_card_cvcCheckFail: "Your card's security code is incorrect.",
    };
    return {
      paymentIntentId,
      outcome: 'FAILED',
      mode: 'stripe_test_simulator',
      failureReason:
        (paymentMethodToken && simulatedReasons[paymentMethodToken]) ||
        'Your card was declined.',
    };
  }

  return {
    paymentIntentId,
    outcome: requestedOutcome,
    mode: 'stripe_test_simulator',
  };
}
