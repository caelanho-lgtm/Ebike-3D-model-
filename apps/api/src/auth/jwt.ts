import jwt from 'jsonwebtoken';
import type { Role } from '@fitwerx/shared';
import { env } from '../env.js';

export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  tenantSlug: string;
  role: Role;
  email: string;
  name: string;
}

export function signToken(payload: JwtPayload): { token: string; expiresIn: number } {
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_TTL_SECONDS,
    issuer: 'fitwerx',
  });
  return { token, expiresIn: env.JWT_TTL_SECONDS };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'fitwerx' }) as JwtPayload;
}
