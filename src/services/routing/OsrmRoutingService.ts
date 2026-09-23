import type { Coordinates, Route, TransportMode } from '@/models';
import { AppError } from '@/utils/errors';
import { isValidCoordinates, polylineLength } from '@/utils/geo';
import { BaseRoutingService } from './RoutingService';

/**
 * Real street routing via the public OSRM instance run by FOSSGIS / OpenStreetMap
 * Germany (routing.openstreetmap.de).
 *
 * Unlike the official project-osrm.org demo (car only) or Neshan (car and
 * motorcycle only, re-timed here as a workaround — see NeshanRoutingService),
 * this server runs dedicated `bike` and `foot` profiles: the geometry it
 * returns follows actual streets, alleys and footpaths, and the distance and
 * duration it reports are computed for that specific mode, not guessed from a
 * different one. No API key needed, and it is what MockRoutingService's
 * bezier-curve geometry was always a stand-in for.
 *
 * This is a public, rate-limited (~1 request/second) demo instance intended
 * for reasonable, non-commercial use — see routing.openstreetmap.de/about.html.
 * Point ProxyRoutingService at your own OSRM/Valhalla deployment for
 * production traffic or guaranteed uptime.
 */
const BASE_URL: Record<TransportMode, string> = {
  bicycle: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
};

const TIMEOUT_MS = 10_000;

interface OsrmRoute {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: [number, number][] };
}

interface OsrmResponse {
  code?: string;
  routes?: OsrmRoute[];
}

export class OsrmRoutingService extends BaseRoutingService {
  readonly id = 'osrm';

  protected async getRoute(
    mode: TransportMode,
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<Route> {
    // OSRM takes coordinates as lng,lat — the one place in this codebase that
    // order is reversed, so it stays contained to this file.
    const url =
      `${BASE_URL[mode]}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(url, { signal: timeout.signal });
      if (!response.ok) {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      const data = (await response.json()) as OsrmResponse;
      const route = data.routes?.[0];
      if (data.code !== 'Ok' || !route) {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      const geometry = (route.geometry?.coordinates ?? [])
        .map(([lng, lat]) => ({ lat, lng }))
        .filter(isValidCoordinates);

      if (geometry.length < 2) {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      return {
        mode,
        distanceMeters: Math.round(route.distance ?? polylineLength(geometry)),
        durationSeconds: Math.round(route.duration ?? 0),
        geometry,
        provider: this.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new AppError('route/failed', "Couldn't calculate this route.", error);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
