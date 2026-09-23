import type { TransportOption } from '@/models';

/**
 * The catalogue of modes the client can pick. Order is the display order.
 * Adding a mode later (motorbike, van) starts here.
 */
export const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    mode: 'bicycle',
    label: 'Bicycle',
    description: 'Best for most parcels across town',
  },
  {
    mode: 'walking',
    label: 'Walking',
    description: 'For short hops and narrow streets',
  },
];
