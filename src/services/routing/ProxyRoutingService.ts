import type { Coordinates, Route, TransportMode } from '@/models';
import { config } from '@/config/env';
import { AppError } from '@/utils/errors';
import { isValidCoordinates, polylineLength } from '@/utils/geo';
import { BaseRoutingService } from './RoutingService';

/**
 * Routing through a backend you control.
 *
 * This is the production-safe option: the secret API key stays on your server,
 * and you can switch routing vendors (Google Routes, OSRM, Valhalla, …) without
 * shipping a new build of the app.
 *
 * Expected contract:
 *   GET {VITE_ROUTING_PROXY_URL}/route
 *       ?mode=bicycle|walking&originLat=&originLng=&destLat=&destLng=
 *   200 -> { distanceMeters, durationSeconds, geometry: [{lat,lng}, ...] }
 *
 * README §Routing has a ~30 line Express implementation of exactly this.
 */
interface ProxyRouteResponse {
  distanceMeters?: number;
  durationSeconds?: number;
  geometry?: unknown;
}

const TIMEOUT_MS = 10_000;

export class ProxyRoutingService extends BaseRoutingService {
  readonly id = 'proxy';

  constructor(private readonly baseUrl: string = config.routing.proxyUrl) {
    super();
  }

  protected async getRoute(
    mode: TransportMode,
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<Route> {
    if (!this.baseUrl) {
      throw new AppError('route/failed', "Couldn't calculate this route.");
    }

    const url =
      `${this.baseUrl.replace(/\/$/, '')}/route?mode=${mode}` +
      `&originLat=${origin.lat}&originLng=${origin.lng}` +
      `&destLat=${destination.lat}&destLng=${destination.lng}`;

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(url, { signal: timeout.signal });
      if (!response.ok) throw new AppError('route/failed', "Couldn't calculate this route.");

      const data = (await response.json()) as ProxyRouteResponse;
      const geometry = Array.isArray(data.geometry)
        ? data.geometry.filter(isValidCoordinates)
        : [];

      if (geometry.length < 2 || typeof data.durationSeconds !== 'number') {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      return {
        mode,
        distanceMeters: Math.round(data.distanceMeters ?? polylineLength(geometry)),
        durationSeconds: Math.round(data.durationSeconds),
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
