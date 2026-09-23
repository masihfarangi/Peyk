import type { Rider } from '@/models';
import { AppError } from '@/utils/errors';
import type { RiderQuery, RiderRepository } from './RiderRepository';

/**
 * Courier matching rules live here rather than in a component: which courier
 * to offer, and how long they will take to reach the pickup point.
 */
export class RiderService {
  constructor(private readonly repository: RiderRepository) {}

  async findRiderForTrip(query: RiderQuery, signal?: AbortSignal): Promise<Rider> {
    const rider = await this.repository.findNearestRider(query, signal);

    if (!rider) {
      throw new AppError('rider/failed', 'No courier is free for that trip right now.');
    }

    // A courier is only ever offered for the mode the client actually picked.
    return { ...rider, vehicleType: query.mode };
  }
}
