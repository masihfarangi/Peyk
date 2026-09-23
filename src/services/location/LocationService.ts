import type { Place } from '@/models';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface LocationRequestOptions {
  timeoutMs?: number;
  maximumAgeMs?: number;
  highAccuracy?: boolean;
}

export interface LocationService {
  readonly id: string;
  isSupported(): boolean;
  /** Best-effort permission check; never prompts the user. */
  getPermissionState(): Promise<PermissionState>;
  /** Single fix. Rejects with an AppError carrying a location/* code. */
  getCurrentPlace(options?: LocationRequestOptions): Promise<Place>;
}
