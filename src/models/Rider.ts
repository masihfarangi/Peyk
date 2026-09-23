import type { TransportMode } from './Transport';

export interface Rider {
  id: string;
  name: string;
  /** 0–5, one decimal place. */
  rating: number;
  /** Image URL, or undefined when we should render initials instead. */
  avatar?: string;
  vehicleType: TransportMode;
  estimatedArrivalMinutes: number;
}
