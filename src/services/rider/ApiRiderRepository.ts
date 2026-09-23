import type { Rider } from '@/models';
import { AppError } from '@/utils/errors';
import type { RiderQuery, RiderRepository } from './RiderRepository';

/**
 * The shape the real backend will plug into.
 *
 *   GET {baseUrl}/riders/nearest?mode=&pickupLat=&pickupLng=&destLat=&destLng=
 *   200 -> { id, name, rating, avatar?, vehicleType, estimatedArrivalMinutes }
 *   204 -> no courier available
 *
 * Wiring it up is a one-line change in services/rider/index.ts.
 */
export class ApiRiderRepository implements RiderRepository {
  readonly id = 'api';

  constructor(private readonly baseUrl: string) {}

  async findNearestRider(query: RiderQuery, signal?: AbortSignal): Promise<Rider | null> {
    const url =
      `${this.baseUrl.replace(/\/$/, '')}/riders/nearest?mode=${query.mode}` +
      `&pickupLat=${query.pickup.lat}&pickupLng=${query.pickup.lng}` +
      `&destLat=${query.destination.lat}&destLng=${query.destination.lng}`;

    try {
      const response = await fetch(url, { signal });
      if (response.status === 204) return null;
      if (!response.ok) throw new AppError('rider/failed', "Couldn't find a courier just yet.");
      return (await response.json()) as Rider;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new AppError('rider/failed', "Couldn't find a courier just yet.", error);
    }
  }
}
