import { config } from '@/config/env';
import { MockRoutingService } from './MockRoutingService';
import { NeshanRoutingService } from './NeshanRoutingService';
import { OsrmRoutingService } from './OsrmRoutingService';
import { ProxyRoutingService } from './ProxyRoutingService';
import type { RoutingService } from './RoutingService';

export type { RoutingService } from './RoutingService';
export { MockRoutingService } from './MockRoutingService';
export { OsrmRoutingService } from './OsrmRoutingService';
export { SPEED_MPS } from './RoutingService';

export function createRoutingService(): RoutingService {
  switch (config.routing.provider) {
    case 'neshan':
      return new NeshanRoutingService();
    case 'proxy':
      return new ProxyRoutingService();
    case 'osrm':
      return new OsrmRoutingService();
    case 'mock':
    default:
      return new MockRoutingService();
  }
}

/**
 * Wraps a routing service so a network failure degrades to mock routes instead
 * of a dead end. The UI is told which provider answered, so it can be honest
 * about showing an estimate.
 */
export function withMockFallback(primary: RoutingService): RoutingService {
  if (primary.id === 'mock') return primary;
  const fallback = new MockRoutingService();

  return {
    id: primary.id,
    getBicycleRoute: async (origin, destination, signal) => {
      try {
        return await primary.getBicycleRoute(origin, destination, signal);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        return fallback.getBicycleRoute(origin, destination, signal);
      }
    },
    getWalkingRoute: async (origin, destination, signal) => {
      try {
        return await primary.getWalkingRoute(origin, destination, signal);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        return fallback.getWalkingRoute(origin, destination, signal);
      }
    },
    getRoutes: async (origin, destination, signal) => {
      try {
        return await primary.getRoutes(origin, destination, signal);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        return fallback.getRoutes(origin, destination, signal);
      }
    },
  };
}
