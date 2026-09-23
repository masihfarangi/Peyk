/**
 * The app never shows a raw technical error. Services throw AppError with a
 * message already written for a person, plus a machine readable `code` for
 * branching and logging.
 */
export type AppErrorCode =
  | 'location/denied'
  | 'location/unavailable'
  | 'location/timeout'
  | 'location/unsupported'
  | 'map/load-failed'
  | 'route/failed'
  | 'rider/failed'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export function toAppError(error: unknown, fallbackCode: AppErrorCode, message: string): AppError {
  if (error instanceof AppError) return error;
  return new AppError(fallbackCode, message, error);
}
