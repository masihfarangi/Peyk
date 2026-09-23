import { config } from '@/config/env';
import type { MapProvider } from './MapProvider';
import { NeshanMapProvider } from './NeshanMapProvider';
import { OsmMapProvider } from './OsmMapProvider';

export type { MapProvider, MarkerKind, MountOptions, FitOptions } from './MapProvider';

/**
 * The single place that decides which map implementation the app runs on.
 * Components receive a MapProvider and never learn which one they got.
 */
export function createMapProvider(): MapProvider {
  switch (config.map.provider) {
    case 'neshan':
      return new NeshanMapProvider();
    case 'osm':
    default:
      return new OsmMapProvider();
  }
}
