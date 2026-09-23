/** A point on the map. Latitude/longitude in WGS84 degrees. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Where a coordinate came from. Drives how much we trust its label. */
export type PlaceSource = 'gps' | 'map-pick' | 'mock';

/**
 * A coordinate plus whatever human readable name we managed to resolve.
 * `label` is always safe to render: services fall back to formatted
 * coordinates when reverse geocoding is unavailable.
 */
export interface Place {
  coordinates: Coordinates;
  label: string;
  /** Longer address line, when the geocoder gives us one. */
  detail?: string;
  source: PlaceSource;
  /** Metres of uncertainty reported by the GPS fix, when known. */
  accuracyMeters?: number;
}

export interface MapBounds {
  southWest: Coordinates;
  northEast: Coordinates;
}
