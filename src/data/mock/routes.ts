import type { TransportMode } from '@/models';

/**
 * The brief's demo numbers, used by MockRoutingService('fixed') for
 * screenshots and walkthroughs: a single, repeatable trip.
 */
export const FIXTURE_DISTANCE_METERS = 3200;

export const FIXTURE_DURATIONS_SECONDS: Record<TransportMode, number> = {
  bicycle: 45 * 60, // 45 min
  walking: 75 * 60, // 1 hr 15 min
};
