import type { Coordinates, Route, TransportMode } from '@/models';
import { config } from '@/config/env';
import { AppError } from '@/utils/errors';
import { polylineLength } from '@/utils/geo';
import { decodePolyline } from '@/utils/polyline';
import { BaseRoutingService, SPEED_MPS } from './RoutingService';

/**
 * Routing through Neshan's direction API.
 *
 *   GET https://api.neshan.org/v4/direction?type=..&origin=lat,lng&destination=lat,lng
 *   Header: Api-Key: <service key>
 *
 * One important limitation: Neshan's direction service only offers `car` and
 * `motorcycle` profiles — there is no bicycle or pedestrian profile. So we ask
 * for the motorcycle profile, which follows the narrow streets and shortcuts a
 * courier actually uses, take its *geometry and distance*, and then apply our
 * own speed profile to get the duration. Neshan's own car/motorcycle ETA would
 * be wrong for a bike and badly wrong for someone on foot.
 *
 * Swap this class out for a provider with real bike/walk profiles (or point
 * ProxyRoutingService at one) when route timing needs to be exact.
 */
const ENDPOINT = 'https://api.neshan.org/v4/direction';
const TIMEOUT_MS = 10_000;

interface NeshanStep {
  polyline?: string;
}

interface NeshanLeg {
  distance?: { value?: number };
  duration?: { value?: number };
  steps?: NeshanStep[];
}

interface NeshanRoute {
  overview_polyline?: { points?: string };
  legs?: NeshanLeg[];
}

interface NeshanDirectionResponse {
  routes?: NeshanRoute[];
}

export class NeshanRoutingService extends BaseRoutingService {
  readonly id = 'neshan';

  constructor(private readonly apiKey: string = config.routing.apiKey) {
    super();
  }

  protected async getRoute(
    mode: TransportMode,
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<Route> {
    if (!this.apiKey) {
      throw new AppError('route/failed', "Couldn't calculate this route.");
    }

    const url =
      `${ENDPOINT}?type=motorcycle` +
      `&origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}`;

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(url, {
        headers: { 'Api-Key': this.apiKey },
        signal: timeout.signal,
      });

      if (!response.ok) {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      const data = (await response.json()) as NeshanDirectionResponse;
      const route = data.routes?.[0];
      const leg = route?.legs?.[0];

      const geometry = this.extractGeometry(route, leg);
      if (geometry.length < 2) {
        throw new AppError('route/failed', "Couldn't calculate this route.");
      }

      const distanceMeters = Math.round(leg?.distance?.value ?? polylineLength(geometry));

      return {
        mode,
        distanceMeters,
        // Re-timed for the actual mode; see the note at the top of this file.
        durationSeconds: Math.round(distanceMeters / SPEED_MPS[mode]),
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

  /** Prefer the overview polyline; fall back to stitching the step polylines. */
  private extractGeometry(
    route: NeshanRoute | undefined,
    leg: NeshanLeg | undefined,
  ): Coordinates[] {
    const overview = route?.overview_polyline?.points;
    if (overview) return decodePolyline(overview);

    const steps = leg?.steps ?? [];
    return steps.flatMap((step) => (step.polyline ? decodePolyline(step.polyline) : []));
  }
}
