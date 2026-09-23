import type { Coordinates } from '@/models';
import { config } from '@/config/env';
import { formatCoordinates } from '@/utils/format';
import type { GeocodingService, ResolvedAddress } from './GeocodingService';

/**
 * Neshan reverse geocoding.
 *
 *   GET https://api.neshan.org/v5/reverse?lat=..&lng=..
 *   Header: Api-Key: <service key>
 *
 * The response carries a formatted address plus neighbourhood/city parts, so
 * we build a short headline and keep the long form as the detail line.
 *
 * This endpoint takes a *service* key. Calling it straight from the browser
 * exposes that key — acceptable for an MVP with a domain-restricted key, but
 * route it through your own proxy before launch (README §Security).
 */
const ENDPOINT = 'https://api.neshan.org/v5/reverse';
const TIMEOUT_MS = 6_000;

interface NeshanReverseResponse {
  status?: string;
  formatted_address?: string;
  neighbourhood?: string;
  route_name?: string;
  city?: string;
  state?: string;
}

export class NeshanGeocodingService implements GeocodingService {
  readonly id = 'neshan';

  /** Rounded-coordinate cache: panning the picker must not spam the API. */
  private cache = new Map<string, ResolvedAddress>();

  constructor(private readonly apiKey: string = config.geocoding.apiKey) {}

  async reverseGeocode(coordinates: Coordinates, signal?: AbortSignal): Promise<ResolvedAddress> {
    const fallback: ResolvedAddress = {
      label: 'Selected point',
      detail: formatCoordinates(coordinates.lat, coordinates.lng),
    };

    if (!this.apiKey) return fallback;

    const cacheKey = `${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const url = `${ENDPOINT}?lat=${coordinates.lat}&lng=${coordinates.lng}`;
      const response = await fetch(url, {
        headers: { 'Api-Key': this.apiKey },
        signal: timeout.signal,
      });

      if (!response.ok) return fallback;

      const data = (await response.json()) as NeshanReverseResponse;
      const label = data.route_name || data.neighbourhood || data.city || fallback.label;
      const detail = data.formatted_address || fallback.detail;

      const resolved: ResolvedAddress = { label, detail };
      this.cache.set(cacheKey, resolved);
      return resolved;
    } catch {
      // A missing address is never worth an error state; show coordinates.
      return fallback;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
