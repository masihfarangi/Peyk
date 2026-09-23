import type { Place, Rider, RouteSet, TransportMode } from '@/models';
import type { AppErrorCode } from '@/utils/errors';

/**
 * The whole client flow as one state machine, with no React and no services in
 * sight. Keeping it pure means the flow can be reasoned about (and tested) on
 * its own, and that components only ever render the state they are handed.
 */

export type TripPhase =
  /** Asking the browser where we are. */
  | 'locating'
  /** We have a pickup point and are waiting for a destination. */
  | 'ready'
  /** The map is in drop-pin mode, for either the pickup or the destination. */
  | 'picking'
  /** Destination chosen, routes in flight. */
  | 'routing'
  /** Routes ready; the sheet is showing transport options. */
  | 'options';

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PickingTarget = 'pickup' | 'destination';

export interface TripError {
  code: AppErrorCode;
  message: string;
}

export interface TripState {
  phase: TripPhase;
  pickup: Place | null;
  destination: Place | null;
  /** The point under the centre pin while picking; not yet confirmed. */
  draftPlace: Place | null;
  /** Which point the drop-pin picker is currently editing. */
  pickingTarget: PickingTarget | null;
  /** The phase to return to if picking is cancelled. */
  returnPhase: TripPhase | null;
  locationStatus: AsyncStatus;
  locationError: TripError | null;
  routes: RouteSet | null;
  routeStatus: AsyncStatus;
  routeError: TripError | null;
  selectedMode: TransportMode | null;
  rider: Rider | null;
  riderStatus: AsyncStatus;
  riderError: TripError | null;
}

export const initialTripState: TripState = {
  phase: 'locating',
  pickup: null,
  destination: null,
  draftPlace: null,
  pickingTarget: null,
  returnPhase: null,
  locationStatus: 'loading',
  locationError: null,
  routes: null,
  routeStatus: 'idle',
  routeError: null,
  selectedMode: null,
  rider: null,
  riderStatus: 'idle',
  riderError: null,
};

export type TripAction =
  | { type: 'location/requested' }
  | { type: 'location/resolved'; place: Place }
  | { type: 'location/failed'; error: TripError }
  | { type: 'pickup/label-resolved'; label: string; detail?: string }
  | { type: 'picking/started'; target: PickingTarget }
  | { type: 'picking/cancelled' }
  | { type: 'picking/draft-moved'; place: Place }
  | { type: 'picking/draft-label-resolved'; label: string; detail?: string }
  | { type: 'picking/confirmed'; place: Place }
  | { type: 'destination/cleared' }
  | { type: 'routes/loading' }
  | { type: 'routes/resolved'; routes: RouteSet }
  | { type: 'routes/failed'; error: TripError }
  | { type: 'mode/selected'; mode: TransportMode }
  | { type: 'rider/search-started' }
  | { type: 'rider/resolved'; rider: Rider }
  | { type: 'rider/failed'; error: TripError };

/** Fields any fresh destination (new pin, or a moved pickup) invalidates. */
const CLEARED_TRIP_PROGRESS = {
  routes: null,
  routeError: null,
  selectedMode: null,
  rider: null,
  riderStatus: 'idle' as const,
  riderError: null,
};

export function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case 'location/requested':
      return {
        ...state,
        phase: state.phase === 'picking' || state.destination ? state.phase : 'locating',
        locationStatus: 'loading',
        locationError: null,
      };

    case 'location/resolved':
      return {
        ...state,
        pickup: action.place,
        locationStatus: 'ready',
        locationError: null,
        // A late fix must not yank the user out of picking or routing.
        phase: state.phase === 'locating' ? 'ready' : state.phase,
      };

    case 'location/failed':
      return { ...state, locationStatus: 'error', locationError: action.error };

    case 'pickup/label-resolved':
      return state.pickup
        ? {
            ...state,
            pickup: { ...state.pickup, label: action.label, detail: action.detail },
          }
        : state;

    case 'picking/started':
      return {
        ...state,
        phase: 'picking',
        pickingTarget: action.target,
        returnPhase: state.phase === 'picking' ? state.returnPhase : state.phase,
        draftPlace: null,
      };

    case 'picking/cancelled':
      return {
        ...state,
        phase: state.returnPhase ?? 'ready',
        pickingTarget: null,
        returnPhase: null,
        draftPlace: null,
      };

    case 'picking/draft-moved':
      return { ...state, draftPlace: action.place };

    case 'picking/draft-label-resolved':
      return state.draftPlace
        ? {
            ...state,
            draftPlace: { ...state.draftPlace, label: action.label, detail: action.detail },
          }
        : state;

    case 'picking/confirmed': {
      if (state.pickingTarget === 'pickup') {
        return {
          ...state,
          phase: state.destination ? 'routing' : 'ready',
          pickup: action.place,
          draftPlace: null,
          pickingTarget: null,
          returnPhase: null,
          // The pickup moved: any quote and courier already found no longer
          // apply. Re-routing (if there's a destination) is kicked off by
          // the controller once this dispatch returns.
          ...(state.destination
            ? { ...CLEARED_TRIP_PROGRESS, routeStatus: 'loading' as const }
            : {}),
        };
      }

      // pickingTarget === 'destination'
      return {
        ...state,
        phase: 'routing',
        destination: action.place,
        draftPlace: null,
        pickingTarget: null,
        returnPhase: null,
        ...CLEARED_TRIP_PROGRESS,
        routeStatus: 'loading',
      };
    }

    case 'destination/cleared':
      return {
        ...state,
        phase: 'ready',
        destination: null,
        draftPlace: null,
        pickingTarget: null,
        returnPhase: null,
        ...CLEARED_TRIP_PROGRESS,
        routeStatus: 'idle',
      };

    case 'routes/loading':
      return { ...state, routeStatus: 'loading', routeError: null };

    case 'routes/resolved':
      return {
        ...state,
        phase: 'options',
        routes: action.routes,
        routeStatus: 'ready',
        routeError: null,
      };

    case 'routes/failed':
      return { ...state, phase: 'options', routeStatus: 'error', routeError: action.error };

    case 'mode/selected':
      return {
        ...state,
        selectedMode: action.mode,
        // Choosing a mode only highlights it — the courier search is a
        // separate, explicit step (see 'rider/search-started').
        rider: null,
        riderStatus: 'idle',
        riderError: null,
      };

    case 'rider/search-started':
      return { ...state, riderStatus: 'loading', riderError: null };

    case 'rider/resolved':
      return { ...state, rider: action.rider, riderStatus: 'ready', riderError: null };

    case 'rider/failed':
      return { ...state, riderStatus: 'error', riderError: action.error };

    default:
      return state;
  }
}

/** The route currently drawn on the map: the selected mode, else cycling. */
export function activeRoute(state: TripState) {
  if (!state.routes) return null;
  return state.routes[state.selectedMode ?? 'bicycle'];
}
