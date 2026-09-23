import type { Coordinates } from '@/models';

export interface ResolvedAddress {
  /** Short name for the headline row, e.g. a street or neighbourhood. */
  label: string;
  /** Full address line, when available. */
  detail?: string;
}

export interface GeocodingService {
  readonly id: string;
  /** Never rejects: implementations fall back to coordinates. */
  reverseGeocode(coordinates: Coordinates, signal?: AbortSignal): Promise<ResolvedAddress>;
}
