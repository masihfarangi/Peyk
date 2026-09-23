import type { Coordinates, MapBounds, RouteGeometry } from '@/models';

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a polyline in metres. */
export function polylineLength(points: RouteGeometry): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistance(points[i - 1], points[i]);
  }
  return total;
}

export function boundsOf(points: Coordinates[]): MapBounds | null {
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return { southWest: { lat: minLat, lng: minLng }, northEast: { lat: maxLat, lng: maxLng } };
}

export function coordinatesEqual(a: Coordinates | null, b: Coordinates | null): boolean {
  if (!a || !b) return a === b;
  return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;
}

export function isValidCoordinates(value: unknown): value is Coordinates {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Coordinates>;
  return (
    typeof candidate.lat === 'number' &&
    typeof candidate.lng === 'number' &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng) &&
    Math.abs(candidate.lat) <= 90 &&
    Math.abs(candidate.lng) <= 180
  );
}
