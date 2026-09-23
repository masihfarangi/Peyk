/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'neshan' | 'osm' — which map implementation to mount. */
  readonly VITE_MAP_PROVIDER?: string;
  /** Neshan *web* (map) key. Public by design, restrict it by domain. */
  readonly VITE_MAP_API_KEY?: string;
  /** Neshan map style: standard-day, standard-night, dreamy, osm-bright… */
  readonly VITE_MAP_TYPE?: string;

  /** 'mock' | 'neshan' | 'proxy' */
  readonly VITE_ROUTING_PROVIDER?: string;
  /** Neshan *service* key. See README: prefer the proxy in production. */
  readonly VITE_ROUTING_API_KEY?: string;
  /** Base URL of your own routing proxy when VITE_ROUTING_PROVIDER=proxy. */
  readonly VITE_ROUTING_PROXY_URL?: string;

  /** 'none' | 'neshan' */
  readonly VITE_GEOCODING_PROVIDER?: string;
  readonly VITE_GEOCODING_API_KEY?: string;

  /** Map centre before a GPS fix arrives. Defaults to central Tehran. */
  readonly VITE_DEFAULT_LAT?: string;
  readonly VITE_DEFAULT_LNG?: string;

  /** 'true' to use a scripted location instead of the real GPS (dev only). */
  readonly VITE_USE_MOCK_LOCATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
