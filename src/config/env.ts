import type { Coordinates } from '@/models';

/**
 * Every environment lookup happens here, once.
 *
 * Nothing else in the app reads `import.meta.env`, which keeps the services
 * testable and makes it obvious what has to be configured for a deployment.
 */

function str(value: string | undefined, fallback = ''): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(str(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: string | undefined, fallback = false): boolean {
  const raw = str(value).toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return fallback;
}

export type MapProviderId = 'neshan' | 'osm';
export type RoutingProviderId = 'mock' | 'neshan' | 'proxy' | 'osrm';
export type GeocodingProviderId = 'none' | 'neshan';

/** Ferdowsi Square, Tehran. Only used until the first GPS fix lands. */
const DEFAULT_CENTER: Coordinates = { lat: 35.6997, lng: 51.338 };

const mapApiKey = str(import.meta.env.VITE_MAP_API_KEY);
const requestedMapProvider = str(import.meta.env.VITE_MAP_PROVIDER, 'neshan') as MapProviderId;

/**
 * Neshan needs a web key to serve tiles. Without one we silently fall back to
 * the OpenStreetMap layer so `npm run dev` works on a fresh clone.
 */
const mapProvider: MapProviderId =
  requestedMapProvider === 'neshan' && mapApiKey === '' ? 'osm' : requestedMapProvider;

const routingApiKey = str(import.meta.env.VITE_ROUTING_API_KEY);
const routingProxyUrl = str(import.meta.env.VITE_ROUTING_PROXY_URL);
// osrm needs no key or URL — real street routing (see OsrmRoutingService) is
// the default so a fresh clone shows actual paths, not the mock's bezier
// curve. withMockFallback (services/index.ts) still covers it going offline.
const requestedRouting = str(import.meta.env.VITE_ROUTING_PROVIDER, 'osrm') as RoutingProviderId;

const routingProvider: RoutingProviderId =
  (requestedRouting === 'neshan' && routingApiKey === '') ||
  (requestedRouting === 'proxy' && routingProxyUrl === '')
    ? 'mock'
    : requestedRouting;

const geocodingApiKey = str(import.meta.env.VITE_GEOCODING_API_KEY, routingApiKey);
const requestedGeocoding = str(
  import.meta.env.VITE_GEOCODING_PROVIDER,
  'none',
) as GeocodingProviderId;

const geocodingProvider: GeocodingProviderId =
  requestedGeocoding === 'neshan' && geocodingApiKey === '' ? 'none' : requestedGeocoding;

export const config = {
  map: {
    provider: mapProvider,
    /** What the .env asked for, so the UI can explain a downgrade. */
    requestedProvider: requestedMapProvider,
    apiKey: mapApiKey,
    mapType: str(import.meta.env.VITE_MAP_TYPE, 'standard-day'),
  },
  routing: {
    provider: routingProvider,
    requestedProvider: requestedRouting,
    apiKey: routingApiKey,
    proxyUrl: routingProxyUrl,
  },
  geocoding: {
    provider: geocodingProvider,
    apiKey: geocodingApiKey,
  },
  location: {
    useMock: bool(import.meta.env.VITE_USE_MOCK_LOCATION, false),
    defaultCenter: {
      lat: num(import.meta.env.VITE_DEFAULT_LAT, DEFAULT_CENTER.lat),
      lng: num(import.meta.env.VITE_DEFAULT_LNG, DEFAULT_CENTER.lng),
    } as Coordinates,
  },
  /**
   * The whole fare formula lives behind these five numbers (see
   * src/services/pricing/PricingService.ts for the formula itself). Nothing
   * about pricing is hardcoded in application logic — tuning a rate for a
   * real deployment is an environment-variable change here, never a code
   * change. Until there's a real admin backend, this .env block *is* the
   * "admin/settings" surface the pricing spec asks for; wiring these same
   * five fields up to a database-backed settings screen is a drop-in
   * replacement for this file, not a change to PricingService.
   */
  pricing: {
    minimumCourierPayToman: num(import.meta.env.VITE_PRICING_MIN_COURIER_PAY, 25_000),
    baseCourierPayToman: num(import.meta.env.VITE_PRICING_BASE_PAY, 10_000),
    distanceRateTomanPerKm: num(import.meta.env.VITE_PRICING_DISTANCE_RATE, 4_000),
    timeRateTomanPerMinute: num(import.meta.env.VITE_PRICING_TIME_RATE, 700),
    platformCommissionRate: num(import.meta.env.VITE_PRICING_COMMISSION_RATE, 0.2),
  },
} as const;

export type AppConfig = typeof config;
