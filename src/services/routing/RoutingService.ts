import type { Coordinates, Route, RouteSet, TransportMode } from '@/models';

/**
 * Route calculation, deliberately separate from map rendering: the map draws
 * whatever geometry it is handed, and does not care who computed it. That is
 * what lets the app show Neshan tiles while routing through a different
 * service (or through nothing at all, in mock mode).
 */
export interface RoutingService {
  readonly id: string;
  getWalkingRoute(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<Route>;
  getBicycleRoute(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<Route>;
  /** Both modes at once, for populating the bottom sheet in one pass. */
  getRoutes(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<RouteSet>;
}

/**
 * Average speeds used to turn a distance into a duration.
 *
 * City cycling including lights and traffic, and an ordinary walking pace.
 * Every implementation shares these so a mode switch never looks inconsistent.
 */
export const SPEED_MPS: Record<TransportMode, number> = {
  bicycle: 4.0, // ~14.4 km/h
  walking: 1.35, // ~4.9 km/h
};

/** Straight-line distance underestimates real streets; this scales it up. */
export const STREET_DETOUR_FACTOR = 1.28;

export abstract class BaseRoutingService implements RoutingService {
  abstract readonly id: string;

  protected abstract getRoute(
    mode: TransportMode,
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<Route>;

  getWalkingRoute(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<Route> {
    return this.getRoute('walking', origin, destination, signal);
  }

  getBicycleRoute(origin: Coordinates, destination: Coordinates, signal?: AbortSignal): Promise<Route> {
    return this.getRoute('bicycle', origin, destination, signal);
  }

  async getRoutes(
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<RouteSet> {
    const [bicycle, walking] = await Promise.all([
      this.getBicycleRoute(origin, destination, signal),
      this.getWalkingRoute(origin, destination, signal),
    ]);
    return { bicycle, walking };
  }
}
