import type { LeafletMapLike, LeafletNamespace } from './LeafletLikeMapProvider';
import { LeafletLikeMapProvider } from './LeafletLikeMapProvider';
import type { MountOptions } from './MapProvider';
import { AppError } from '@/utils/errors';

/**
 * OpenStreetMap tiles through the npm Leaflet package.
 *
 * This is the development and fallback provider: it needs no API key, so a
 * fresh clone runs immediately. Iran is well mapped in OSM, which makes it a
 * usable stand-in until a Neshan key is added.
 *
 * Note: the public OSM tile servers are rate limited and not meant for
 * production traffic. Ship with Neshan (or another paid tile source).
 */
export class OsmMapProvider extends LeafletLikeMapProvider {
  readonly id = 'osm';

  protected async createMap(
    container: HTMLElement,
    options: MountOptions,
  ): Promise<{ L: LeafletNamespace; map: LeafletMapLike }> {
    // Dynamic import keeps Leaflet out of the initial bundle.
    const leaflet = await import('leaflet');
    const L = (leaflet.default ?? leaflet) as unknown as LeafletNamespace;

    if (!L.map || !L.tileLayer) {
      throw new AppError('map/load-failed', "Couldn't load the map.");
    }

    const map = L.map(container, {
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
      crossOrigin: true,
    }).addTo(map);

    return { L, map };
  }
}
