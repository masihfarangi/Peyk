import type { Coordinates, RouteGeometry, TransportMode } from '@/models';

/** The three things we ever pin on the map. */
export type MarkerKind = 'user' | 'origin' | 'destination';

export interface MountOptions {
  center: Coordinates;
  zoom: number;
  /** Called when the user taps a point on the map. */
  onMapTap?: (coordinates: Coordinates) => void;
  /** Called after any pan/zoom settles. Used by the drop-pin picker. */
  onCenterChanged?: (coordinates: Coordinates) => void;
}

export interface FitOptions {
  /** Extra padding in CSS pixels, so the route is not hidden by the sheet. */
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  maxZoom?: number;
}

/**
 * Everything the app needs from a map, expressed without a single
 * provider-specific type. Swapping Neshan for Balad, MapLibre or anything else
 * means writing one new class and changing one line in createMapProvider().
 */
export interface MapProvider {
  /** Stable id, e.g. 'neshan' or 'osm'. Shown in the debug/attribution line. */
  readonly id: string;

  /** Attach the map to a DOM node. Resolves once the map is interactive. */
  mount(container: HTMLElement, options: MountOptions): Promise<void>;

  /** Tear down listeners and DOM. Safe to call more than once. */
  destroy(): void;

  setCenter(center: Coordinates, options?: { zoom?: number; animate?: boolean }): void;
  getCenter(): Coordinates | null;

  /** Pass null to remove the marker. */
  setMarker(kind: MarkerKind, coordinates: Coordinates | null): void;

  /** Draw (or clear) the route line. Style follows the selected mode. */
  setRoute(geometry: RouteGeometry | null, mode?: TransportMode): void;

  /** Zoom/pan so every point is comfortably visible. */
  fitTo(points: Coordinates[], options?: FitOptions): void;

  /** Call after the container resizes (sheet open/close, orientation change). */
  invalidateSize(): void;
}
