// ---------------------------------------------------------------
// Smart Transportation — Ticket Validation Service (O8)
// ---------------------------------------------------------------
// Verifies HMAC-SHA256 signed QR payloads (or manual ticket codes),
// transitions valid ACTIVE tickets to USED to prevent reuse, and
// logs every validation attempt in TicketValidation.
// ---------------------------------------------------------------

import { ValidationResult } from '@prisma/client';
import { prisma } from '../config/prisma';
import { verifySignedQrPayload } from '../utils/qr';
import type { ValidateTicketInput } from '../validators/ticket.validator';

const ticketInclude = {
  booking: {
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      originStation: { select: { id: true, nameEn: true } },
      destinationStation: { select: { id: true, nameEn: true } },
      busRoute: { select: { id: true, code: true, nameEn: true } },
      originStop: { select: { id: true, nameEn: true } },
      destinationStop: { select: { id: true, nameEn: true } },
    },
  },
} as const;

function formatTicketSummary(ticket: any) {
  if (!ticket) return null;
  const b = ticket.booking;
  const originName =
    b.transportType === 'METRO'
      ? (b.originStation?.nameEn ?? '')
      : (b.originStop?.nameEn ?? '');
  const destinationName =
    b.transportType === 'METRO'
      ? (b.destinationStation?.nameEn ?? '')
      : (b.destinationStop?.nameEn ?? '');

  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    status: ticket.status,
    issuedAt: ticket.issuedAt,
    expiresAt: ticket.expiresAt,
    usedAt: ticket.usedAt,
    booking: {
      id: b.id,
      transportType: b.transportType,
      originName,
      destinationName,
      busRoute: b.busRoute ?? null,
      stopCount: b.stopCount,
      totalAmount: b.totalAmount,
      currency: b.currency,
      passengerName: b.user?.fullName ?? 'Passenger',
    },
  };
}

export async function validateTicket(
  employeeId: string,
  input: ValidateTicketInput
) {
  const scannedCode = input.qrPayload
    ? input.qrPayload.trim()
    : input.ticketCode!.trim().toUpperCase();
  const stationName = input.stationName?.trim() || null;

  // 1. If a QR payload was scanned, verify its HMAC-SHA256 signature first
  if (input.qrPayload) {
    const isSigned = verifySignedQrPayload(scannedCode);
    if (!isSigned) {
      const validation = await prisma.ticketValidation.create({
        data: {
          ticketId: null,
          employeeId,
          scannedCode,
          result: ValidationResult.INVALID,
          stationName,
          notes: 'Invalid or tampered QR signature',
        },
      });
      return {
        valid: false,
        result: ValidationResult.INVALID,
        message: 'Invalid or tampered QR code.',
        ticket: null,
        validation,
      };
    }
  }

  // 2. Look up the ticket by signed QR payload or manual ticketCode
  const ticket = input.qrPayload
    ? await prisma.ticket.findUnique({
        where: { qrPayload: scannedCode },
        include: ticketInclude,
      })
    : await prisma.ticket.findUnique({
        where: { ticketCode: scannedCode },
        include: ticketInclude,
      });

  if (!ticket) {
    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: null,
        employeeId,
        scannedCode,
        result: ValidationResult.INVALID,
        stationName,
        notes: 'Ticket not found',
      },
    });
    return {
      valid: false,
      result: ValidationResult.INVALID,
      message: 'Ticket not found.',
      ticket: null,
      validation,
    };
  }

  // 3. Reject already-used tickets
  if (ticket.status === 'USED') {
    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: ticket.id,
        employeeId,
        scannedCode,
        result: ValidationResult.ALREADY_USED,
        stationName,
        notes: 'Ticket already used',
      },
    });
    return {
      valid: false,
      result: ValidationResult.ALREADY_USED,
      message: 'Ticket has already been used.',
      ticket: formatTicketSummary(ticket),
      validation,
    };
  }

  // 4. Reject expired tickets (and persist EXPIRED status if still ACTIVE)
  const now = new Date();
  if (ticket.status === 'EXPIRED' || ticket.expiresAt < now) {
    const expiredTicket =
      ticket.status === 'ACTIVE'
        ? await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'EXPIRED' },
            include: ticketInclude,
          })
        : ticket;

    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: ticket.id,
        employeeId,
        scannedCode,
        result: ValidationResult.EXPIRED,
        stationName,
        notes: 'Ticket expired',
      },
    });
    return {
      valid: false,
      result: ValidationResult.EXPIRED,
      message: 'Ticket has expired.',
      ticket: formatTicketSummary(expiredTicket),
      validation,
    };
  }

  // 5. Reject revoked tickets or non-confirmed bookings
  if (ticket.status === 'REVOKED' || ticket.booking.status !== 'CONFIRMED') {
    const validation = await prisma.ticketValidation.create({
      data: {
        ticketId: ticket.id,
        employeeId,
        scannedCode,
        result: ValidationResult.INVALID,
        stationName,
        notes: 'Ticket revoked or unpaid',
      },
    });
    return {
      valid: false,
      result: ValidationResult.INVALID,
      message: 'Ticket is not valid for travel.',
      ticket: formatTicketSummary(ticket),
      validation,
    };
  }

  // 6. Valid ACTIVE ticket -> mark USED and log VALID scan
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: 'USED',
      usedAt: now,
    },
    include: ticketInclude,
  });

  const validation = await prisma.ticketValidation.create({
    data: {
      ticketId: ticket.id,
      employeeId,
      scannedCode,
      result: ValidationResult.VALID,
      stationName,
      notes: 'Entry granted',
    },
  });

  return {
    valid: true,
    result: ValidationResult.VALID,
    message: 'Ticket is valid. Entry granted.',
    ticket: formatTicketSummary(updatedTicket),
    validation,
  };
}

export async function getRecentValidations(employeeId: string, role: string) {
  const logs = await prisma.ticketValidation.findMany({
    where: role === 'ADMIN' ? {} : { employeeId },
    orderBy: { validatedAt: 'desc' },
    take: 50,
    include: {
      employee: { select: { id: true, fullName: true, email: true } },
      ticket: {
        include: ticketInclude,
      },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    result: log.result,
    scannedCode: log.scannedCode,
    stationName: log.stationName,
    notes: log.notes,
    validatedAt: log.validatedAt,
    employee: log.employee,
    ticket: formatTicketSummary(log.ticket),
  }));
}
