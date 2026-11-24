// ---------------------------------------------------------------
// Smart Transportation — Signed QR Code Utility
// ---------------------------------------------------------------
// Generates unique ticket codes, HMAC-SHA256 signed QR payloads,
// and base64 PNG data URLs for cross-platform display & scanning.
// ---------------------------------------------------------------

import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env';

export function generateTicketCode(): string {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ST-${randomPart}`;
}

export function createSignedQrPayload(ticketCode: string, bookingId: string): string {
  const body = `ST1.${ticketCode}.${bookingId.slice(0, 8)}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(body)
    .digest('hex')
    .slice(0, 16);
  return `${body}.${signature}`;
}

export function verifySignedQrPayload(qrPayload: string): boolean {
  const parts = qrPayload.split('.');
  if (parts.length !== 4 || parts[0] !== 'ST1') {
    return false;
  }
  const body = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const expectedSig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(body)
    .digest('hex')
    .slice(0, 16);

  const providedBuf = Buffer.from(parts[3]);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export async function generateQrDataUrl(qrPayload: string): Promise<string> {
  return QRCode.toDataURL(qrPayload, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#162A22',
      light: '#FFFFFF',
    },
  });
}
