import { createGeocodingService, type GeocodingService } from './geocoding';
import { createLocationService, type LocationService } from './location';
import { createMapProvider, type MapProvider } from './map';
import { createRoutingService, withMockFallback, type RoutingService } from './routing';
import { createRiderService, RiderService } from './rider';

/**
 * Everything the app talks to, assembled once.
 *
 * Components receive these through React context, so a test or a Storybook
 * story can hand down fakes without touching a single component.
 */
export interface Services {
  location: LocationService;
  geocoding: GeocodingService;
  routing: RoutingService;
  rider: RiderService;
  /** A factory, not an instance: each mounted map owns its own provider. */
  createMap: () => MapProvider;
}

export function createServices(): Services {
  return {
    location: createLocationService(),
    geocoding: createGeocodingService(),
    routing: withMockFallback(createRoutingService()),
    rider: createRiderService(),
    createMap: createMapProvider,
  };
}

export type { LocationService } from './location';
export type { GeocodingService } from './geocoding';
export type { RoutingService } from './routing';
export type { MapProvider } from './map';
export { RiderService };
