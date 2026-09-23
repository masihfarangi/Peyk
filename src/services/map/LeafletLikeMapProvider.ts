import type { Coordinates, RouteGeometry, TransportMode } from '@/models';
import { boundsOf } from '@/utils/geo';
import type { FitOptions, MapProvider, MarkerKind, MountOptions } from './MapProvider';

/*
 * Both supported providers expose a Leaflet-shaped API: the npm `leaflet`
 * package, and Neshan's hosted SDK (a Leaflet fork served from
 * static.neshan.org). This base class holds the logic they share, so each
 * concrete provider only has to answer one question: "give me an L and a map".
 *
 * The namespace is typed structurally rather than imported from @types/leaflet,
 * because the Neshan fork has the same shape but ships no types of its own.
 */

export interface LeafletLayer {
  addTo(map: LeafletMapLike): LeafletLayer;
  remove(): void;
  setLatLng?(latlng: [number, number]): unknown;
  setLatLngs?(latlngs: [number, number][]): unknown;
  setStyle?(style: Record<string, unknown>): unknown;
}

export interface LeafletMapLike {
  setView(center: [number, number], zoom?: number, options?: Record<string, unknown>): unknown;
  getCenter(): { lat: number; lng: number };
  getZoom(): number;
  fitBounds(bounds: [[number, number], [number, number]], options?: Record<string, unknown>): unknown;
  invalidateSize(options?: boolean | Record<string, unknown>): unknown;
  on(event: string, handler: (event: { latlng?: { lat: number; lng: number } }) => void): unknown;
  remove(): void;
  removeLayer(layer: LeafletLayer): unknown;
}

export interface LeafletNamespace {
  map?: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMapLike;
  marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletLayer;
  polyline: (latlngs: [number, number][], options?: Record<string, unknown>) => LeafletLayer;
  divIcon: (options: Record<string, unknown>) => unknown;
  tileLayer?: (url: string, options?: Record<string, unknown>) => LeafletLayer;
}

/** Markers are inline SVG so they match the app's line-art language exactly. */
const MARKER_SVG: Record<MarkerKind, { html: string; size: [number, number]; anchor: [number, number] }> = {
  user: {
    // Live GPS position: a solid dot with a soft halo.
    html: `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11" fill="rgba(0,0,0,0.10)"/>
      <circle cx="13" cy="13" r="6" fill="#000" stroke="#fff" stroke-width="2.5"/>
    </svg>`,
    size: [26, 26],
    anchor: [13, 13],
  },
  origin: {
    // Pickup: a ring, echoing the wheel in the logo.
    html: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="12" cy="12" r="3.5" fill="#000"/>
    </svg>`,
    size: [24, 24],
    anchor: [12, 12],
  },
  destination: {
    // Drop-off: a line-art pin, drawn in the same 1.75 stroke as every icon.
    html: `<svg width="30" height="38" viewBox="0 0 30 38" fill="none" aria-hidden="true"
        stroke="#000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 36c0 0-11-11.5-11-20A11 11 0 0 1 26 16c0 8.5-11 20-11 20Z" fill="#fff"/>
      <rect x="10.5" y="11" width="9" height="9" rx="1.5" fill="#fff"/>
      <path d="M15 11v9"/>
    </svg>`,
    size: [30, 38],
    anchor: [15, 37],
  },
};

export abstract class LeafletLikeMapProvider implements MapProvider {
  abstract readonly id: string;

  protected L: LeafletNamespace | null = null;
  protected map: LeafletMapLike | null = null;

  private markers = new Map<MarkerKind, LeafletLayer>();
  private routeCasing: LeafletLayer | null = null;
  private routeLine: LeafletLayer | null = null;
  private destroyed = false;

  /**
   * Concrete providers load their SDK and return a live map instance bound to
   * `container`. Everything else is handled here.
   */
  protected abstract createMap(
    container: HTMLElement,
    options: MountOptions,
  ): Promise<{ L: LeafletNamespace; map: LeafletMapLike }>;

  async mount(container: HTMLElement, options: MountOptions): Promise<void> {
    const { L, map } = await this.createMap(container, options);
    if (this.destroyed) {
      map.remove();
      return;
    }

    this.L = L;
    this.map = map;

    if (options.onMapTap) {
      map.on('click', (event) => {
        if (event.latlng) options.onMapTap?.({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
    }

    if (options.onCenterChanged) {
      const emit = () => {
        const center = this.getCenter();
        if (center) options.onCenterChanged?.(center);
      };
      map.on('moveend', emit);
      map.on('zoomend', emit);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.markers.clear();
    this.routeCasing = null;
    this.routeLine = null;
    try {
      this.map?.remove();
    } catch {
      // The container may already be gone during a hot reload; nothing to do.
    }
    this.map = null;
    this.L = null;
  }

  setCenter(center: Coordinates, options?: { zoom?: number; animate?: boolean }): void {
    if (!this.map) return;
    this.map.setView([center.lat, center.lng], options?.zoom ?? this.map.getZoom(), {
      animate: options?.animate ?? true,
    });
  }

  getCenter(): Coordinates | null {
    if (!this.map) return null;
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  setMarker(kind: MarkerKind, coordinates: Coordinates | null): void {
    if (!this.map || !this.L) return;

    const existing = this.markers.get(kind);

    if (!coordinates) {
      if (existing) {
        this.map.removeLayer(existing);
        this.markers.delete(kind);
      }
      return;
    }

    if (existing?.setLatLng) {
      existing.setLatLng([coordinates.lat, coordinates.lng]);
      return;
    }

    const spec = MARKER_SVG[kind];
    const marker = this.L.marker([coordinates.lat, coordinates.lng], {
      icon: this.L.divIcon({
        className: 'peyk-marker',
        html: spec.html,
        iconSize: spec.size,
        iconAnchor: spec.anchor,
      }),
      interactive: false,
      keyboard: false,
      // Destination sits above pickup, pickup above the live dot.
      zIndexOffset: kind === 'destination' ? 400 : kind === 'origin' ? 300 : 200,
    });

    marker.addTo(this.map);
    this.markers.set(kind, marker);
  }

  setRoute(geometry: RouteGeometry | null, mode: TransportMode = 'bicycle'): void {
    if (!this.map || !this.L) return;

    if (this.routeCasing) {
      this.map.removeLayer(this.routeCasing);
      this.routeCasing = null;
    }
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }

    if (!geometry || geometry.length < 2) return;

    const latlngs = geometry.map((point) => [point.lat, point.lng] as [number, number]);

    // White casing first so the black line stays readable over dark map areas.
    this.routeCasing = this.L
      .polyline(latlngs, {
        color: '#FFFFFF',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      })
      .addTo(this.map);

    this.routeLine = this.L
      .polyline(latlngs, {
        color: '#000000',
        weight: 3.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        // Walking reads as a dotted trail, cycling as a solid line.
        dashArray: mode === 'walking' ? '1 7' : undefined,
        interactive: false,
      })
      .addTo(this.map);
  }

  fitTo(points: Coordinates[], options?: FitOptions): void {
    if (!this.map) return;
    const bounds = boundsOf(points);
    if (!bounds) return;

    const paddingX = options?.paddingX ?? 56;

    this.map.fitBounds(
      [
        [bounds.southWest.lat, bounds.southWest.lng],
        [bounds.northEast.lat, bounds.northEast.lng],
      ],
      {
        paddingTopLeft: [paddingX, options?.paddingTop ?? 140],
        paddingBottomRight: [paddingX, options?.paddingBottom ?? 120],
        maxZoom: options?.maxZoom ?? 16,
        animate: true,
      },
    );
  }

  invalidateSize(): void {
    this.map?.invalidateSize(false);
  }
}
