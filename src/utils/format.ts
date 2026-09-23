/**
 * Human readable formatting. The wording here is the app's voice, so it lives
 * in one place rather than being spelled out in each component.
 */

/** 2700 -> "45 min", 4500 -> "1 hr 15 min", 40 -> "1 min". */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/** 850 -> "850 m", 4200 -> "4.2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Fallback label when no geocoder is configured. */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** 48500 -> "48,500 Toman". */
export function formatToman(amount: number): string {
  return `${amount.toLocaleString('en-US')} Toman`;
}

export function formatArrival(minutes: number): string {
  if (minutes <= 1) return 'Arriving now';
  return `Arrives in ${minutes} min`;
}

/** "Ali Rezaei" -> "AR", used when a rider has no avatar. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
