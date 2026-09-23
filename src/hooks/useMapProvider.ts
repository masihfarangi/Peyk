import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coordinates } from '@/models';
import type { MapProvider, MountOptions } from '@/services/map';
import { useServices } from '@/state/ServicesContext';

export type MapStatus = 'loading' | 'ready' | 'error';

/**
 * Owns one map instance: creates it, mounts it into `containerRef`, and tears
 * it down on unmount. Components get back a status and a provider handle, and
 * still know nothing about Neshan, Leaflet or tiles.
 */
export function useMapProvider(options: {
  center: Coordinates;
  zoom: number;
  onMapTap?: (coordinates: Coordinates) => void;
  onCenterChanged?: (coordinates: Coordinates) => void;
}) {
  const services = useServices();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<MapProvider | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  // Handlers are kept in a ref so re-renders never remount the map.
  const handlers = useRef<Pick<MountOptions, 'onMapTap' | 'onCenterChanged'>>({});
  handlers.current = {
    onMapTap: options.onMapTap,
    onCenterChanged: options.onCenterChanged,
  };

  const initial = useRef({ center: options.center, zoom: options.zoom });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const provider = services.createMap();
    setStatus('loading');

    provider
      .mount(container, {
        center: initial.current.center,
        zoom: initial.current.zoom,
        onMapTap: (coordinates) => handlers.current.onMapTap?.(coordinates),
        onCenterChanged: (coordinates) => handlers.current.onCenterChanged?.(coordinates),
      })
      .then(() => {
        if (cancelled) {
          provider.destroy();
          return;
        }
        providerRef.current = provider;
        setStatus('ready');
        // The container often finishes sizing a frame after mount.
        requestAnimationFrame(() => provider.invalidateSize());
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      providerRef.current = null;
      provider.destroy();
    };
  }, [services, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { containerRef, provider: providerRef, status, retry };
}
