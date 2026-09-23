import type { Coordinates, Rider, TransportMode } from '@/models';

export interface RiderQuery {
  mode: TransportMode;
  pickup: Coordinates;
  destination: Coordinates;
}

/**
 * Data access for couriers. Today it reads a fixture; tomorrow it calls a
 * dispatch backend. The service above it never has to know which.
 */
export interface RiderRepository {
  readonly id: string;
  findNearestRider(query: RiderQuery, signal?: AbortSignal): Promise<Rider | null>;
}
