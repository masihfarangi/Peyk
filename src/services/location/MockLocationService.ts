import type { Coordinates, Place } from '@/models';
import { config } from '@/config/env';
import { formatCoordinates } from '@/utils/format';
import type { LocationService, PermissionState } from './LocationService';

/**
 * Scripted location for development: desktop browsers without GPS, emulators,
 * and demos where you need the same pickup point every run.
 * Enable with VITE_USE_MOCK_LOCATION=true.
 */
export class MockLocationService implements LocationService {
  readonly id = 'mock';

  constructor(
    private readonly coordinates: Coordinates = config.location.defaultCenter,
    private readonly delayMs = 600,
  ) {}

  isSupported(): boolean {
    return true;
  }

  async getPermissionState(): Promise<PermissionState> {
    return 'granted';
  }

  async getCurrentPlace(): Promise<Place> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return {
      coordinates: this.coordinates,
      label: 'Current location',
      detail: formatCoordinates(this.coordinates.lat, this.coordinates.lng),
      source: 'mock',
      accuracyMeters: 20,
    };
  }
}
