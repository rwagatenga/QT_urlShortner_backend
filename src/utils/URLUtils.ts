import { Request } from 'express';
import crypto from 'crypto';

export function generateShortCode(length = 6) {
  return crypto.randomBytes(4).toString('hex').slice(0, 8);
}

export function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return Array.isArray(forwardedFor)
      ? forwardedFor[0]?.split(',')[0] || null
      : forwardedFor.split(',')[0] || null;
  }

  return req.socket.remoteAddress || null;
}
