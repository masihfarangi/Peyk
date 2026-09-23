import type { Place } from '@/models';
import { AppError } from '@/utils/errors';
import { formatCoordinates } from '@/utils/format';
import type { LocationRequestOptions, LocationService, PermissionState } from './LocationService';

/**
 * navigator.geolocation, wrapped so callers get a Place and an AppError with a
 * message already written for a person.
 *
 * Requires a secure context (HTTPS or localhost). Inside a Capacitor WebView
 * this same API works once the Android location permissions are declared.
 *
 * A device's very first fix is often the coarsest one it can produce — many
 * phones and most laptops start from cell-tower or Wi-Fi based positioning
 * (accuracy in the hundreds of metres to several kilometres, and occasionally
 * wildly wrong — a fix reported on the other side of the world is almost
 * always this, not a broken GPS chip) before the real GPS/GNSS radio locks on
 * a couple of seconds later. So this watches for a short window rather than
 * taking a single reading, and keeps whichever fix came back most accurate —
 * resolving early the moment a genuinely tight (sub-50m) fix arrives. The
 * `Place` this resolves with always carries `accuracyMeters`, so the UI can
 * still warn the person and offer the manual picker when even the best fix
 * over that window is coarse.
 */
export class BrowserLocationService implements LocationService {
  readonly id = 'browser';

  /** A fix at or below this accuracy is treated as good enough to stop early. */
  private static readonly GOOD_ENOUGH_ACCURACY_M = 50;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  async getPermissionState(): Promise<PermissionState> {
    if (!this.isSupported()) return 'denied';
    if (typeof navigator.permissions?.query !== 'function') return 'unknown';

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return status.state as PermissionState;
    } catch {
      // Safari has historically thrown here for the geolocation descriptor.
      return 'unknown';
    }
  }

  getCurrentPlace(options: LocationRequestOptions = {}): Promise<Place> {
    const { timeoutMs = 12_000, maximumAgeMs = 30_000, highAccuracy = true } = options;

    if (!this.isSupported()) {
      return Promise.reject(
        new AppError('location/unsupported', "This browser can't share your location."),
      );
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return Promise.reject(
        new AppError(
          'location/unsupported',
          'Location needs a secure (HTTPS) connection to work.',
        ),
      );
    }

    return new Promise<Place>((resolve, reject) => {
      let best: GeolocationPosition | null = null;
      let settled = false;
      let watchId: number | null = null;

      const toPlace = (position: GeolocationPosition): Place => {
        const { latitude, longitude, accuracy } = position.coords;
        return {
          coordinates: { lat: latitude, lng: longitude },
          label: 'Current location',
          detail: formatCoordinates(latitude, longitude),
          source: 'gps',
          accuracyMeters: Number.isFinite(accuracy) ? accuracy : undefined,
        };
      };

      const stop = () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(deadline);
      };

      const succeed = (position: GeolocationPosition) => {
        if (settled) return;
        settled = true;
        stop();
        resolve(toPlace(position));
      };

      const failWith = (appError: AppError) => {
        if (settled) return;
        settled = true;
        stop();
        reject(appError);
      };

      const deadline = window.setTimeout(() => {
        // Time's up — use whatever we have rather than leaving the person
        // stuck, even if it never reached the "good enough" threshold.
        if (best) succeed(best);
        else failWith(new AppError('location/timeout', 'Finding your location took too long.'));
      }, timeoutMs);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const accuracy = position.coords.accuracy ?? Infinity;
          if (!best || accuracy < (best.coords.accuracy ?? Infinity)) {
            best = position;
          }
          if (accuracy <= BrowserLocationService.GOOD_ENOUGH_ACCURACY_M) {
            succeed(position);
          }
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              failWith(
                new AppError(
                  'location/denied',
                  'Location access is needed to set your pickup point.',
                  error,
                ),
              );
              break;
            case error.TIMEOUT:
              failWith(
                new AppError('location/timeout', 'Finding your location took too long.', error),
              );
              break;
            default:
              // A transient error while watching isn't necessarily fatal if
              // we already have a usable fix — only fail outright if not.
              if (best) succeed(best);
              else {
                failWith(new AppError('location/unavailable', "Couldn't find your location.", error));
              }
          }
        },
        { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: maximumAgeMs },
      );
    });
  }
}
