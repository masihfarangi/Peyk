import type { Coordinates, Route, RouteGeometry, TransportMode } from '@/models';
import { haversineDistance } from '@/utils/geo';
import { FIXTURE_DISTANCE_METERS, FIXTURE_DURATIONS_SECONDS } from '@/data/mock/routes';
import { BaseRoutingService, SPEED_MPS, STREET_DETOUR_FACTOR } from './RoutingService';

export type MockRoutingMode = 'speed' | 'fixed';

/**
 * Routing with no backend at all — the default, so the app is fully usable on
 * a fresh clone.
 *
 * 'speed' (default) derives a believable distance and duration from the two
 * points, so times change as you move the destination.
 * 'fixed' always returns the brief's demo numbers (45 min / 1 hr 15 min),
 * which is handy for screenshots and walkthroughs.
 *
 * The geometry is a gently curved path rather than a straight line, so the
 * drawn route reads as a route instead of a ruler. It is not street-accurate;
 * swap in a real provider for that.
 */
export class MockRoutingService extends BaseRoutingService {
  readonly id = 'mock';

  constructor(
    private readonly mode: MockRoutingMode = 'speed',
    private readonly latencyMs = 450,
  ) {
    super();
  }

  protected async getRoute(
    mode: TransportMode,
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<Route> {
    await this.simulateLatency(signal);

    const straight = haversineDistance(origin, destination);
    const distanceMeters =
      this.mode === 'fixed' ? FIXTURE_DISTANCE_METERS : Math.round(straight * STREET_DETOUR_FACTOR);

    const durationSeconds =
      this.mode === 'fixed'
        ? FIXTURE_DURATIONS_SECONDS[mode]
        : Math.round(distanceMeters / SPEED_MPS[mode]);

    return {
      mode,
      distanceMeters,
      durationSeconds,
      geometry: buildCurvedPath(origin, destination, mode),
      provider: this.id,
    };
  }

  private simulateLatency(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(resolve, this.latencyMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }
}

/**
 * A quadratic bezier between the points, bowed perpendicular to the line.
 * Walking bows the opposite way from cycling, so switching mode visibly
 * changes the drawn path the way a real routing engine would.
 */
function buildCurvedPath(
  origin: Coordinates,
  destination: Coordinates,
  mode: TransportMode,
  steps = 48,
): RouteGeometry {
  const bow = (mode === 'walking' ? -1 : 1) * 0.12;

  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;

  // Perpendicular offset, scaled by the span so the bow stays proportional.
  const controlLat = midLat + -dLng * bow;
  const controlLng = midLng + dLat * bow;

  const points: RouteGeometry = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const inv = 1 - t;
    points.push({
      lat: inv * inv * origin.lat + 2 * inv * t * controlLat + t * t * destination.lat,
      lng: inv * inv * origin.lng + 2 * inv * t * controlLng + t * t * destination.lng,
    });
  }
  return points;
}
