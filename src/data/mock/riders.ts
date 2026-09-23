import type { Rider } from '@/models';

/**
 * Stand-in courier roster. Replace with a real dispatch API by swapping
 * MockRiderRepository for ApiRiderRepository — no UI change required.
 *
 * Avatars are intentionally omitted so the RiderCard renders initials, which
 * keeps the first load light and avoids shipping fake photos of real people.
 */
export const MOCK_RIDERS: Rider[] = [
  { id: 'r-1', name: 'Ali', rating: 4.9, vehicleType: 'bicycle', estimatedArrivalMinutes: 6 },
  { id: 'r-2', name: 'Sara', rating: 4.8, vehicleType: 'bicycle', estimatedArrivalMinutes: 9 },
  { id: 'r-3', name: 'Reza', rating: 4.7, vehicleType: 'walking', estimatedArrivalMinutes: 11 },
  { id: 'r-4', name: 'Mina', rating: 5.0, vehicleType: 'walking', estimatedArrivalMinutes: 8 },
];
