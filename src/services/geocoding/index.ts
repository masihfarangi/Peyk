import { config } from '@/config/env';
import { CoordinateGeocodingService } from './CoordinateGeocodingService';
import { NeshanGeocodingService } from './NeshanGeocodingService';
import type { GeocodingService } from './GeocodingService';

export type { GeocodingService, ResolvedAddress } from './GeocodingService';

export function createGeocodingService(): GeocodingService {
  return config.geocoding.provider === 'neshan'
    ? new NeshanGeocodingService()
    : new CoordinateGeocodingService();
}
