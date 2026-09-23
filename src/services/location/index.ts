import { config } from '@/config/env';
import { BrowserLocationService } from './BrowserLocationService';
import { MockLocationService } from './MockLocationService';
import type { LocationService } from './LocationService';

export type { LocationService, PermissionState, LocationRequestOptions } from './LocationService';
export { BrowserLocationService } from './BrowserLocationService';
export { MockLocationService } from './MockLocationService';

export function createLocationService(): LocationService {
  return config.location.useMock ? new MockLocationService() : new BrowserLocationService();
}
