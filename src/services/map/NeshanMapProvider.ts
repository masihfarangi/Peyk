import { config } from '@/config/env';
import { AppError } from '@/utils/errors';
import { loadScriptOnce, loadStylesheetOnce } from '@/utils/loadExternalScript';
import {
  LeafletLikeMapProvider,
  type LeafletMapLike,
  type LeafletNamespace,
} from './LeafletLikeMapProvider';
import type { MountOptions } from './MapProvider';

/**
 * Neshan map, via the Leaflet-compatible web SDK hosted on static.neshan.org.
 *
 * The SDK is not published on npm, so it is injected at runtime the first time
 * a map mounts. `new L.Map(el, { key, maptype, ... })` is Neshan's documented
 * browser entry point; the rest of the surface is stock Leaflet, which is why
 * this class only has to supply the namespace and the map instance.
 *
 * The map key is a public, client-side key. Restrict it by domain in the
 * Neshan developer panel — see README §Security.
 */

const SDK_VERSION = '1.4.0';
const SDK_JS = `https://static.neshan.org/sdk/leaflet/${SDK_VERSION}/leaflet.js`;
const SDK_CSS = `https://static.neshan.org/sdk/leaflet/${SDK_VERSION}/leaflet.css`;

type NeshanGlobal = LeafletNamespace & {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => LeafletMapLike;
};

export class NeshanMapProvider extends LeafletLikeMapProvider {
  readonly id = 'neshan';

  protected async createMap(
    container: HTMLElement,
    options: MountOptions,
  ): Promise<{ L: LeafletNamespace; map: LeafletMapLike }> {
    if (!config.map.apiKey) {
      throw new AppError('map/load-failed', 'The map is not configured yet.');
    }

    loadStylesheetOnce(SDK_CSS);

    try {
      await loadScriptOnce(SDK_JS);
    } catch (error) {
      throw new AppError('map/load-failed', "Couldn't load the map.", error);
    }

    const L = (window as unknown as { L?: NeshanGlobal }).L;
    if (!L?.Map) {
      throw new AppError('map/load-failed', "Couldn't load the map.");
    }

    const map = new L.Map(container, {
      key: config.map.apiKey,
      maptype: config.map.mapType,
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom,
      poi: true,
      traffic: false,
      zoomControl: false,
      attributionControl: true,
    });

    return { L, map };
  }
}
