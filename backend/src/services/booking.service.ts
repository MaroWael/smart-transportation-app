// ---------------------------------------------------------------
// Smart Transportation — Booking, Payment & Ticket Service
// ---------------------------------------------------------------
// Handles:
//   - Creating bookings (Metro & Bus) with authoritative server fare
//   - Stripe Test Mode checkout confirmation (SUCCEEDED / FAILED / CANCELLED)
//   - Automatic signed QR ticket issuance on SUCCEEDED payment only
//   - Passenger-scoped booking history & detail retrieval
// ---------------------------------------------------------------

import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { calculateJourney } from './journey.service';
import {
  confirmTestPaymentIntent,
  createTestCheckoutSession,
  createTestPaymentIntent,
  StripeTestCardToken,
  TestPaymentOutcome,
  verifyTestCheckoutSession,
} from './stripe.service';
import {
  createSignedQrPayload,
  generateQrDataUrl,
  generateTicketCode,
} from '../utils/qr';
import { CreateBookingInput } from '../validators/booking.validator';

const TICKET_VALIDITY_HOURS = 24;

const bookingInclude = {
  originStation: { select: { id: true, nameEn: true } },
  destinationStation: { select: { id: true, nameEn: true } },
  busRoute: { select: { id: true, code: true, nameEn: true } },
  originStop: { select: { id: true, nameEn: true } },
  destinationStop: { select: { id: true, nameEn: true } },
  payment: true,
  ticket: true,
} as const;

async function formatBooking(record: any, includeQrImage = true) {
  const originName =
    record.transportType === 'METRO'
      ? (record.originStation?.nameEn ?? 'Unknown')
      : (record.originStop?.nameEn ?? 'Unknown');

  const destinationName =
    record.transportType === 'METRO'
      ? (record.destinationStation?.nameEn ?? 'Unknown')
      : (record.destinationStop?.nameEn ?? 'Unknown');

  let ticketDto = null;
  if (record.ticket) {
    const isExpired =
      record.ticket.status === 'ACTIVE' &&
      new Date(record.ticket.expiresAt).getTime() < Date.now();

    ticketDto = {
      id: record.ticket.id,
      ticketCode: record.ticket.ticketCode,
      qrPayload: record.ticket.qrPayload,
      qrImageDataUrl: includeQrImage
        ? await generateQrDataUrl(record.ticket.qrPayload)
        : undefined,
      status: isExpired ? 'EXPIRED' : record.ticket.status,
      issuedAt: record.ticket.issuedAt,
      expiresAt: record.ticket.expiresAt,
      usedAt: record.ticket.usedAt,
    };
  }

  return {
    id: record.id,
    userId: record.userId,
    transportType: record.transportType,
    originName,
    destinationName,
    busRoute: record.busRoute ?? null,
    stopCount: record.stopCount,
    distanceKm: record.distanceKm ?? null,
    totalAmount: record.totalAmount,
    currency: record.currency,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    payment: record.payment
      ? {
          id: record.payment.id,
          stripePaymentIntentId: record.payment.stripePaymentIntentId,
          amount: record.payment.amount,
          currency: record.payment.currency,
          status: record.payment.status,
          paidAt: record.payment.paidAt,
        }
      : null,
    ticket: ticketDto,
  };
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  // Always compute authoritative fare and validate route server-side
  const journey = await calculateJourney(input);

  const intent = await createTestPaymentIntent(
    journey.fare.amount,
    journey.fare.currency,
    {
      userId,
      transportType: journey.transportType,
      origin: journey.origin.nameEn,
      destination: journey.destination.nameEn,
    }
  );

  const booking = await prisma.booking.create({
    data: {
      userId,
      transportType: journey.transportType,
      originStationId:
        input.transportType === 'METRO' ? input.originStationId : null,
      destinationStationId:
        input.transportType === 'METRO' ? input.destinationStationId : null,
      busRouteId: input.transportType === 'BUS' ? input.busRouteId : null,
      originStopId: input.transportType === 'BUS' ? input.originStopId : null,
      destinationStopId:
        input.transportType === 'BUS' ? input.destinationStopId : null,
      fareRuleId: journey.fare.fareRuleId,
      stopCount: journey.stopCount,
      distanceKm: journey.distanceKm ?? null,
      totalAmount: journey.fare.amount,
      currency: journey.fare.currency,
      status: 'PENDING',
      payment: {
        create: {
          stripePaymentIntentId: intent.paymentIntentId,
          amount: journey.fare.amount,
          currency: journey.fare.currency,
          status: 'PENDING',
        },
      },
    },
    include: bookingInclude,
  });

  const formatted = await formatBooking(booking, false);

  return {
    booking: formatted,
    stripe: {
      paymentIntentId: intent.paymentIntentId,
      clientSecret: intent.clientSecret,
      mode: intent.mode,
    },
  };
}

export async function confirmBookingPayment(
  userId: string,
  bookingId: string,
  outcome: TestPaymentOutcome,
  paymentMethodToken?: StripeTestCardToken
) {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!existing) {
    throw new AppError('Booking not found', 404);
  }

  if (existing.userId !== userId) {
    throw new AppError('You do not have permission to access this booking', 403);
  }

  if (existing.status === 'CONFIRMED' && existing.ticket) {
    return formatBooking(existing, true);
  }

  if (existing.status !== 'PENDING' && existing.status !== 'FAILED') {
    throw new AppError(
      `Booking cannot be paid because its status is ${existing.status}`,
      400
    );
  }

  if (!existing.payment) {
    throw new AppError('Payment record not found for booking', 404);
  }

  const stripeResult = await confirmTestPaymentIntent(
    existing.payment.stripePaymentIntentId,
    outcome,
    paymentMethodToken
  );

  if (stripeResult.outcome === 'SUCCEEDED') {
    const ticketCode = generateTicketCode();
    const qrPayload = createSignedQrPayload(ticketCode, existing.id);
    const expiresAt = new Date(
      Date.now() + TICKET_VALIDITY_HOURS * 60 * 60 * 1000
    );

    const updated = await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'CONFIRMED',
        payment: {
          update: {
            status: 'SUCCEEDED',
            paidAt: new Date(),
          },
        },
        ticket: {
          create: {
            ticketCode,
            qrPayload,
            status: 'ACTIVE',
            expiresAt,
          },
        },
      },
      include: bookingInclude,
    });

    return formatBooking(updated, true);
  }

  // FAILED or CANCELLED — never mark as paid and never issue a ticket
  const nextStatus = stripeResult.outcome === 'CANCELLED' ? 'CANCELLED' : 'FAILED';

  const updated = await prisma.booking.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      payment: {
        update: {
          status: nextStatus,
        },
      },
    },
    include: bookingInclude,
  });

  const formatted = await formatBooking(updated, false);
  return {
    ...formatted,
    failureReason: stripeResult.failureReason ?? null,
  };
}

export async function getMyBookings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: bookingInclude,
  });

  return Promise.all(bookings.map((b) => formatBooking(b, false)));
}

export async function getBookingById(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.userId !== userId) {
    throw new AppError('You do not have permission to access this booking', 403);
  }

  return formatBooking(booking, true);
}

export async function createStripeCheckoutForBooking(
  userId: string,
  bookingId: string,
  backendOrigin: string,
  appReturnUrl?: string
) {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!existing) {
    throw new AppError('Booking not found', 404);
  }

  if (existing.userId !== userId) {
    throw new AppError('You do not have permission to access this booking', 403);
  }

  if (existing.status !== 'PENDING') {
    throw new AppError(
      `Booking cannot be paid because its status is ${existing.status}`,
      400
    );
  }

  const originName =
    existing.transportType === 'METRO'
      ? (existing.originStation?.nameEn ?? 'Origin')
      : (existing.originStop?.nameEn ?? 'Origin');

  const destName =
    existing.transportType === 'METRO'
      ? (existing.destinationStation?.nameEn ?? 'Destination')
      : (existing.destinationStop?.nameEn ?? 'Destination');

  const modeLabel =
    existing.transportType === 'METRO'
      ? 'Cairo Metro Ticket'
      : `Bus Ticket (${existing.busRoute?.code ?? 'BUS'})`;

  const returnParam = appReturnUrl
    ? `&appReturn=${encodeURIComponent(appReturnUrl)}`
    : '';

  const successUrl = `${backendOrigin}/api/bookings/stripe/return?status=success&bookingId=${existing.id}&session_id={CHECKOUT_SESSION_ID}${returnParam}`;
  const cancelUrl = `${backendOrigin}/api/bookings/stripe/return?status=cancel&bookingId=${existing.id}${returnParam}`;

  let checkout;
  try {
    checkout = await createTestCheckoutSession({
      bookingId: existing.id,
      title: modeLabel,
      description: `${originName} → ${destName} (${existing.stopCount} stops)`,
      amount: existing.totalAmount,
      currency: existing.currency,
      successUrl,
      cancelUrl,
    });
  } catch (err) {
    throw new AppError(
      err instanceof Error
        ? `Stripe Checkout error: ${err.message}`
        : 'Unable to start Stripe Checkout session',
      502
    );
  }

  // Persist the Stripe Checkout Session ID on the Payment record for verification
  if (existing.payment) {
    await prisma.payment.update({
      where: { id: existing.payment.id },
      data: {
        stripePaymentIntentId: checkout.sessionId,
      },
    });
  }

  return checkout;
}

export async function verifyStripeCheckoutForBooking(
  userId: string,
  bookingId: string
) {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!existing) {
    throw new AppError('Booking not found', 404);
  }

  if (existing.userId !== userId) {
    throw new AppError('You do not have permission to access this booking', 403);
  }

  if (existing.status === 'CONFIRMED' && existing.ticket) {
    return formatBooking(existing, true);
  }

  if (!existing.payment) {
    throw new AppError('Payment record not found for booking', 404);
  }

  const refId = existing.payment.stripePaymentIntentId;
  if (!refId.startsWith('cs_')) {
    return formatBooking(existing, true);
  }

  const verified = await verifyTestCheckoutSession(refId);

  if (verified.status === 'SUCCEEDED') {
    const ticketCode = generateTicketCode();
    const qrPayload = createSignedQrPayload(ticketCode, existing.id);
    const expiresAt = new Date(
      Date.now() + TICKET_VALIDITY_HOURS * 60 * 60 * 1000
    );

    const updated = await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'CONFIRMED',
        payment: {
          update: {
            status: 'SUCCEEDED',
            paidAt: new Date(),
            ...(verified.paymentIntentId
              ? { stripePaymentIntentId: verified.paymentIntentId }
              : {}),
          },
        },
        ticket: {
          create: {
            ticketCode,
            qrPayload,
            status: 'ACTIVE',
            expiresAt,
          },
        },
      },
      include: bookingInclude,
    });

    return formatBooking(updated, true);
  }

  if (verified.status === 'CANCELLED') {
    const updated = await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'CANCELLED',
        payment: {
          update: {
            status: 'CANCELLED',
          },
        },
      },
      include: bookingInclude,
    });
    return formatBooking(updated, false);
  }

  return formatBooking(existing, false);
}
