import { ERROR_CODES, type ErrorCode } from '@fitwerx/shared';

/** Application error mapped to an HTTP status + stable error code. */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (m: string, d?: unknown) =>
  new HttpError(400, ERROR_CODES.VALIDATION, m, d);
export const unauthorized = (m = 'Authentication required') =>
  new HttpError(401, ERROR_CODES.UNAUTHORIZED, m);
export const forbidden = (m = 'Insufficient permissions') =>
  new HttpError(403, ERROR_CODES.FORBIDDEN, m);
export const notFound = (m = 'Resource not found') =>
  new HttpError(404, ERROR_CODES.NOT_FOUND, m);
export const conflict = (m: string) => new HttpError(409, ERROR_CODES.CONFLICT, m);
