import type { Coordinates } from '@/models';
import { formatCoordinates } from '@/utils/format';
import type { GeocodingService, ResolvedAddress } from './GeocodingService';

/**
 * No-network fallback. Used when no geocoding key is configured, and as the
 * safety net whenever a real geocoder fails: the UI always has something
 * truthful to show for a point.
 */
export class CoordinateGeocodingService implements GeocodingService {
  readonly id = 'coordinates';

  async reverseGeocode(coordinates: Coordinates): Promise<ResolvedAddress> {
    return {
      label: 'Selected point',
      detail: formatCoordinates(coordinates.lat, coordinates.lng),
    };
  }
}
