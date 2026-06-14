import type { Role } from '@fitwerx/shared';

/** Authenticated principal attached to a request. */
export interface AuthContext {
  tenantId: string;
  tenantSlug: string;
  /** Present for user (JWT) auth; absent for API-key auth. */
  userId?: string;
  /** Effective role. API keys map to a fixed 'fitter'-equivalent for writes. */
  role: Role;
  /** How the request authenticated. */
  via: 'jwt' | 'apikey';
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
