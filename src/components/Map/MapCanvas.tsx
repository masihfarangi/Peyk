import { useEffect, useRef } from 'react';
import type { Coordinates, Place, Route, TransportMode } from '@/models';
import type { PickingTarget } from '@/state/tripReducer';
import { useMapProvider } from '@/hooks/useMapProvider';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { CrosshairIcon } from '@/components/ui/icons';

interface MapCanvasProps {
  center: Coordinates;
  pickup: Place | null;
  destination: Place | null;
  route: Route | null;
  mode: TransportMode;
  /** Which point (if any) the centre pin is currently choosing. */
  pickingTarget: PickingTarget | null;
  /** How much of the map the sheet covers, so routes are fitted above it. */
  bottomInset: number;
  onCenterChanged: (coordinates: Coordinates) => void;
  /** Asks the app to refresh the GPS fix; the camera move happens here. */
  onRecenter: () => void;
}

/**
 * The bridge between React's declarative world and the map's imperative one.
 *
 * Props describe what should be on the map; effects below push those changes
 * into the provider. This is the only component that holds a map handle.
 */
export function MapCanvas({
  center,
  pickup,
  destination,
  route,
  mode,
  pickingTarget,
  bottomInset,
  onCenterChanged,
  onRecenter,
}: MapCanvasProps) {
  const pickingRef = useRef(pickingTarget);
  pickingRef.current = pickingTarget;

  const { containerRef, provider, status, retry } = useMapProvider({
    center,
    zoom: 15,
    // Tapping a point while picking slides the pin there, instead of asking
    // the user to hit a small target exactly.
    onMapTap: (coordinates) => {
      if (pickingRef.current) provider.current?.setCenter(coordinates);
    },
    onCenterChanged: (coordinates) => {
      if (pickingRef.current) onCenterChanged(coordinates);
    },
  });

  const hasFittedRoute = useRef<string | null>(null);
  const seededPickingFor = useRef<PickingTarget | null>(null);

  // Entering pick mode centres the camera on whatever point is being edited
  // (the existing pickup, or the existing destination — falling back to
  // pickup for a fresh destination), then seeds the draft with whatever
  // ends up under the pin.
  useEffect(() => {
    if (status !== 'ready') return;

    if (!pickingTarget) {
      seededPickingFor.current = null;
      return;
    }
    if (seededPickingFor.current === pickingTarget) return;
    seededPickingFor.current = pickingTarget;

    const seedCoordinates =
      pickingTarget === 'pickup' ? pickup?.coordinates : (destination?.coordinates ?? pickup?.coordinates);
    if (seedCoordinates) {
      provider.current?.setCenter(seedCoordinates, { zoom: 16, animate: false });
    }

    const centre = provider.current?.getCenter();
    if (centre) onCenterChanged(centre);
  }, [destination, onCenterChanged, pickingTarget, pickup, provider, status]);

  /* Markers -------------------------------------------------------------- */

  useEffect(() => {
    if (status !== 'ready') return;
    // While picking the pickup, the floating centre pin stands in for it.
    const show = pickingTarget !== 'pickup';
    provider.current?.setMarker('user', show ? (pickup?.coordinates ?? null) : null);
    provider.current?.setMarker('origin', show ? (pickup?.coordinates ?? null) : null);
  }, [pickingTarget, pickup, provider, status]);

  useEffect(() => {
    if (status !== 'ready') return;
    // While picking the destination, the floating centre pin stands in for it.
    const show = pickingTarget !== 'destination';
    provider.current?.setMarker('destination', show ? (destination?.coordinates ?? null) : null);
  }, [destination, pickingTarget, provider, status]);

  /* Route ---------------------------------------------------------------- */

  useEffect(() => {
    if (status !== 'ready') return;
    provider.current?.setRoute(route?.geometry ?? null, mode);
  }, [mode, provider, route, status]);

  /* Camera --------------------------------------------------------------- */

  // Centre on the pickup point as soon as we have one, before any route.
  useEffect(() => {
    if (status !== 'ready' || pickingTarget || !pickup || destination) return;
    provider.current?.setCenter(pickup.coordinates, { zoom: 16 });
  }, [destination, pickingTarget, pickup, provider, status]);

  // Fit the whole trip once per route, not on every pan.
  useEffect(() => {
    if (status !== 'ready' || !route || !pickup || !destination || pickingTarget) return;

    const key = `${route.mode}:${route.geometry.length}:${destination.coordinates.lat}:${pickup.coordinates.lat}`;
    if (hasFittedRoute.current === key) return;
    hasFittedRoute.current = key;

    provider.current?.fitTo([pickup.coordinates, ...route.geometry, destination.coordinates], {
      paddingTop: 150,
      paddingBottom: bottomInset + 32,
    });
  }, [bottomInset, destination, pickingTarget, pickup, provider, route, status]);

  // The sheet resizing changes the visible map area.
  useEffect(() => {
    if (status !== 'ready') return;
    const timer = window.setTimeout(() => provider.current?.invalidateSize(), 220);
    return () => window.clearTimeout(timer);
  }, [bottomInset, provider, status]);

  const pickingLabel = pickingTarget === 'pickup' ? 'the pickup point' : 'the destination';

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label={
          pickingTarget
            ? `Map. Pan to move ${pickingLabel}, or tap a point to place it.`
            : 'Map showing the trip.'
        }
      />

      {status === 'loading' ? (
        <div className="absolute inset-0 grid place-items-center bg-mist">
          <Spinner label="Loading the map" />
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="absolute inset-0 grid place-items-center bg-mist p-6">
          <div className="w-full max-w-sm">
            <ErrorNotice message="Couldn't load the map." actionLabel="Retry" onAction={retry} />
          </div>
        </div>
      ) : null}

      {/* Centre pin. Fixed to the middle of the map while picking, so the
          user moves the map under it rather than aiming at a small target. */}
      {pickingTarget && status === 'ready' ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full"
          aria-hidden="true"
        >
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" className="drop-shadow-sm">
            <g
              stroke="#CB2027"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#fff"
            >
              <path d="M17 40s-12.5-13-12.5-22.5a12.5 12.5 0 0 1 25 0C29.5 27 17 40 17 40Z" />
              <rect x="12" y="12" width="10" height="10" rx="1.5" />
              <path d="M17 12v10" />
            </g>
          </svg>
        </div>
      ) : null}

      {status === 'ready' ? (
        <button
          type="button"
          onClick={() => {
            if (pickup) provider.current?.setCenter(pickup.coordinates, { zoom: 16 });
            onRecenter();
          }}
          className="absolute right-4 z-[500] grid h-11 w-11 place-items-center rounded-full border border-line bg-paper text-ink shadow-float transition-transform duration-150 ease-spring motion-safe:active:scale-95"
          style={{ bottom: bottomInset + 16 }}
          aria-label="Centre the map on my location"
        >
          <CrosshairIcon size={20} />
        </button>
      ) : null}
    </div>
  );
}
