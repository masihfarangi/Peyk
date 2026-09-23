import type { Coordinates } from './Location';
import type { TransportMode } from './Transport';

/** An ordered polyline, in the order it should be drawn/travelled. */
export type RouteGeometry = Coordinates[];

export interface Route {
  mode: TransportMode;
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteGeometry;
  /** Which RoutingService produced this — surfaced for debugging/telemetry. */
  provider: string;
}

/** Both modes at once, as returned by RoutingService.getRoutes(). */
export type RouteSet = Record<TransportMode, Route>;
