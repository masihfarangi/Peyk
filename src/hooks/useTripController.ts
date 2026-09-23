import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Coordinates, PriceQuote, TransportMode } from '@/models';
import { useServices } from '@/state/ServicesContext';
import {
  activeRoute,
  initialTripState,
  tripReducer,
  type PickingTarget,
  type TripError,
} from '@/state/tripReducer';
import { quotePrice } from '@/services/pricing';
import { AppError } from '@/utils/errors';
import { formatCoordinates } from '@/utils/format';

/**
 * The trip flow, wired up.
 *
 * Components call the returned actions and render the returned state; all the
 * sequencing — locate, label, route, price, match a courier, cancel in-flight
 * work — happens here, against service interfaces rather than concrete APIs.
 */

function toTripError(error: unknown, fallbackMessage: string): TripError {
  if (error instanceof AppError) return { code: error.code, message: error.message };
  return { code: 'unknown', message: fallbackMessage };
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export function useTripController() {
  const services = useServices();
  const [state, dispatch] = useReducer(tripReducer, initialTripState);

  // One controller per concern, so a fast re-pick cancels only its own work.
  const routeRequest = useRef<AbortController | null>(null);
  const riderRequest = useRef<AbortController | null>(null);
  const draftGeocode = useRef<AbortController | null>(null);
  const draftTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      routeRequest.current?.abort();
      riderRequest.current?.abort();
      draftGeocode.current?.abort();
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    },
    [],
  );

  /* ---------------------------------------------------------------- location */

  const locate = useCallback(async () => {
    dispatch({ type: 'location/requested' });

    try {
      const place = await services.location.getCurrentPlace();
      dispatch({ type: 'location/resolved', place });

      // The address is a nicety; the flow never waits on it.
      const address = await services.geocoding.reverseGeocode(place.coordinates);
      if (address.label && address.label !== 'Selected point') {
        dispatch({ type: 'pickup/label-resolved', label: address.label, detail: address.detail });
      }
    } catch (error) {
      dispatch({
        type: 'location/failed',
        error: toTripError(error, "Couldn't find your location."),
      });
    }
  }, [services]);

  const loadRoutes = useCallback(
    async (pickup: Coordinates, destination: Coordinates) => {
      routeRequest.current?.abort();
      const controller = new AbortController();
      routeRequest.current = controller;

      dispatch({ type: 'routes/loading' });

      try {
        const routes = await services.routing.getRoutes(pickup, destination, controller.signal);
        if (controller.signal.aborted) return;
        dispatch({ type: 'routes/resolved', routes });
      } catch (error) {
        if (isAbort(error)) return;
        dispatch({
          type: 'routes/failed',
          error: toTripError(error, "Couldn't calculate this route."),
        });
      }
    },
    [services],
  );

  /* ---------------------------------------------------------- picking (pin) */

  /** Opens the drop-pin picker for either the pickup point or the destination. */
  const startPicking = useCallback((target: PickingTarget) => {
    dispatch({ type: 'picking/started', target });
  }, []);

  const cancelPicking = useCallback(() => {
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftGeocode.current?.abort();
    dispatch({ type: 'picking/cancelled' });
  }, []);

  /** Called continuously as the map moves under the centre pin. */
  const moveDraftPlace = useCallback(
    (coordinates: Coordinates) => {
      const place = {
        coordinates,
        label: 'Selected point',
        detail: formatCoordinates(coordinates.lat, coordinates.lng),
        source: 'map-pick' as const,
      };
      dispatch({ type: 'picking/draft-moved', place });

      // Debounced so panning the map does not hammer the geocoder.
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      draftGeocode.current?.abort();

      draftTimer.current = window.setTimeout(() => {
        const controller = new AbortController();
        draftGeocode.current = controller;

        void services.geocoding
          .reverseGeocode(coordinates, controller.signal)
          .then((address) => {
            if (controller.signal.aborted) return;
            dispatch({
              type: 'picking/draft-label-resolved',
              label: address.label,
              detail: address.detail,
            });
          })
          .catch(() => undefined);
      }, 350);
    },
    [services],
  );

  const confirmPicking = useCallback(() => {
    const place = state.draftPlace;
    const target = state.pickingTarget;
    if (!place || !target) return;

    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftGeocode.current?.abort();

    const pickupCoords = state.pickup?.coordinates;
    const destinationCoords = state.destination?.coordinates;

    dispatch({ type: 'picking/confirmed', place });

    // Whichever point just moved, re-route immediately if the trip now has
    // both ends — this is what lets moving the pickup pin (e.g. to correct a
    // bad GPS fix mid-trip) refresh the quote instead of leaving it stale.
    if (target === 'destination' && pickupCoords) {
      void loadRoutes(pickupCoords, place.coordinates);
    } else if (target === 'pickup' && destinationCoords) {
      void loadRoutes(place.coordinates, destinationCoords);
    }
  }, [loadRoutes, state.destination, state.draftPlace, state.pickingTarget, state.pickup]);

  const clearDestination = useCallback(() => {
    routeRequest.current?.abort();
    riderRequest.current?.abort();
    dispatch({ type: 'destination/cleared' });
  }, []);

  const retryRoutes = useCallback(() => {
    if (!state.pickup || !state.destination) return;
    void loadRoutes(state.pickup.coordinates, state.destination.coordinates);
  }, [loadRoutes, state.destination, state.pickup]);

  /* ------------------------------------------------------------------ rider */

  const selectMode = useCallback((mode: TransportMode) => {
    dispatch({ type: 'mode/selected', mode });
  }, []);

  /** Explicit "find a courier" step — kept separate from picking a mode so
   * the person can compare bicycle vs walking before committing to a search. */
  const findCourier = useCallback(() => {
    const { pickup, destination, selectedMode } = state;
    if (!pickup || !destination || !selectedMode) return;

    riderRequest.current?.abort();
    const controller = new AbortController();
    riderRequest.current = controller;

    dispatch({ type: 'rider/search-started' });

    void services.rider
      .findRiderForTrip(
        { mode: selectedMode, pickup: pickup.coordinates, destination: destination.coordinates },
        controller.signal,
      )
      .then((rider) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'rider/resolved', rider });
      })
      .catch((error: unknown) => {
        if (isAbort(error) || controller.signal.aborted) return;
        dispatch({
          type: 'rider/failed',
          error: toTripError(error, "Couldn't find a courier just yet."),
        });
      });
  }, [services, state]);

  /* ----------------------------------------------------------------- effects */

  // Ask for location once, on first mount.
  useEffect(() => {
    void locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const route = useMemo(() => activeRoute(state), [state]);

  /** Both modes' fares, recomputed whenever the routes change. Each mode is
   * priced from its own route (distance + ETA), since a bike and a walking
   * trip cover the same points differently. */
  const prices = useMemo<Record<TransportMode, PriceQuote> | null>(() => {
    if (!state.routes) return null;
    return {
      bicycle: quotePrice(state.routes.bicycle),
      walking: quotePrice(state.routes.walking),
    };
  }, [state.routes]);

  return {
    state,
    route,
    prices,
    actions: {
      locate,
      startPicking,
      cancelPicking,
      moveDraftPlace,
      confirmPicking,
      clearDestination,
      retryRoutes,
      selectMode,
      findCourier,
    },
  };
}

export type TripController = ReturnType<typeof useTripController>;
