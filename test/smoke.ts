/**
 * Headless checks of the trip flow, pricing and geo maths — no browser
 * needed. Run with `npm run smoke`.
 *
 * The original suite that shipped with this repo (the README's "69 checks")
 * was not part of the archive this rebuild started from, so this is a
 * smaller replacement focused on the behaviour that changed in this pass:
 * the generalized pickup/destination picker, the decoupled courier search,
 * and the new pricing service. Treat it as a starting point, not parity with
 * whatever the original covered.
 */
import { tripReducer, initialTripState, activeRoute, type TripState } from '@/state/tripReducer';
import { quotePrice } from '@/services/pricing/PricingService';
import { config } from '@/config/env';
import { haversineDistance, boundsOf, coordinatesEqual, isValidCoordinates } from '@/utils/geo';
import { formatDistance, formatDuration, formatToman, initialsOf } from '@/utils/format';
import type { Place, Route, RouteSet } from '@/models';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`✗ ${name}`);
  }
}

const TEHRAN: Place = {
  coordinates: { lat: 35.6997, lng: 51.338 },
  label: 'Ferdowsi Square',
  source: 'gps',
  accuracyMeters: 15,
};

const BEIJING_COORDS = { lat: 39.9042, lng: 116.4074 };

const DESTINATION: Place = {
  coordinates: { lat: 35.71, lng: 51.35 },
  label: 'A destination',
  source: 'map-pick',
};

function makeRoute(mode: Route['mode'], distanceMeters: number, durationSeconds: number): Route {
  return {
    mode,
    distanceMeters,
    durationSeconds,
    geometry: [TEHRAN.coordinates, DESTINATION.coordinates],
    provider: 'mock',
  };
}

/* --------------------------------------------------------------- geo utils */

check(
  'haversineDistance: Tehran to itself is 0',
  haversineDistance(TEHRAN.coordinates, TEHRAN.coordinates) === 0,
);

check(
  'haversineDistance: Tehran to a nearby point is a few km, not thousands',
  (() => {
    const d = haversineDistance(TEHRAN.coordinates, DESTINATION.coordinates);
    return d > 0 && d < 5000;
  })(),
);

check(
  'boundsOf: single point has zero-size bounds',
  (() => {
    const bounds = boundsOf([TEHRAN.coordinates]);
    return (
      bounds !== null &&
      bounds.southWest.lat === bounds.northEast.lat &&
      bounds.southWest.lng === bounds.northEast.lng
    );
  })(),
);

check('boundsOf: empty list is null', boundsOf([]) === null);

check(
  'coordinatesEqual: identical points match, distant ones do not',
  coordinatesEqual(TEHRAN.coordinates, { ...TEHRAN.coordinates }) &&
    !coordinatesEqual(TEHRAN.coordinates, BEIJING_COORDS),
);

check('isValidCoordinates: rejects out-of-range latitude', !isValidCoordinates({ lat: 999, lng: 0 }));
check('isValidCoordinates: accepts a real coordinate', isValidCoordinates(TEHRAN.coordinates));

/* ---------------------------------------------------------------- format */

check('formatDuration: sub-minute rounds up to 1 min', formatDuration(10) === '1 min');
check('formatDuration: 45 min stays 45 min', formatDuration(45 * 60) === '45 min');
check('formatDuration: 75 min becomes "1 hr 15 min"', formatDuration(75 * 60) === '1 hr 15 min');
check('formatDistance: under 1km rounds to nearest 10m', formatDistance(853) === '850 m');
check('formatDistance: over 1km shows one decimal', formatDistance(4200) === '4.2 km');
check('formatToman: groups thousands', formatToman(48500) === '48,500 Toman');
check('initialsOf: takes first letter of first two words', initialsOf('Ali Rezaei') === 'AR');

/* ------------------------------------------------------------------ pricing */

check(
  'quotePrice: a very short trip is clamped to the configured minimum',
  quotePrice(makeRoute('bicycle', 50, 30)).totalToman >=
    config.pricing.minimumCourierPayToman,
);

check(
  'quotePrice: matches the spec formula exactly for a trip above the minimum',
  (() => {
    const route = makeRoute('bicycle', 5000, 900); // 5km, 15min
    const quote = quotePrice(route);
    const {
      baseCourierPayToman,
      distanceRateTomanPerKm,
      timeRateTomanPerMinute,
      platformCommissionRate,
    } = config.pricing;

    const expectedCourierPay = baseCourierPayToman + 5 * distanceRateTomanPerKm + 15 * timeRateTomanPerMinute;
    const expectedTotal = Math.round((expectedCourierPay * (1 + platformCommissionRate)) / 1000) * 1000;

    return quote.courierPayToman === Math.round(expectedCourierPay) && quote.totalToman === expectedTotal;
  })(),
);

check(
  'quotePrice: a longer route costs more than a shorter one, same mode',
  (() => {
    const shortFare = quotePrice(makeRoute('bicycle', 1000, 300));
    const longFare = quotePrice(makeRoute('bicycle', 5000, 900));
    return longFare.totalToman > shortFare.totalToman;
  })(),
);

check(
  'quotePrice: customer price is courier pay plus commission, never below it',
  (() => {
    const quote = quotePrice(makeRoute('walking', 3000, 2200));
    return quote.totalToman > quote.courierPayToman;
  })(),
);

check(
  'quotePrice: the customer total is always a multiple of 1,000 Toman',
  quotePrice(makeRoute('bicycle', 3175, 812)).totalToman % 1000 === 0,
);

check(
  'quotePrice: walking and bicycle are priced from their own route, not shared',
  (() => {
    // Same distance, different duration (as a real walk vs ride would be) —
    // the fares must differ because time is a priced input.
    const bikeQuote = quotePrice(makeRoute('bicycle', 3000, 700));
    const walkQuote = quotePrice(makeRoute('walking', 3000, 2200));
    return bikeQuote.totalToman !== walkQuote.totalToman;
  })(),
);

check(
  'quotePrice: same route is deterministic (no hidden time-of-day or traffic input)',
  (() => {
    const route = makeRoute('walking', 2000, 1500);
    return quotePrice(route).totalToman === quotePrice(route).totalToman;
  })(),
);

/* -------------------------------------------------------------- trip reducer */

function dispatch(state: TripState, action: Parameters<typeof tripReducer>[1]): TripState {
  return tripReducer(state, action);
}

check('initial phase is locating', initialTripState.phase === 'locating');

let s = dispatch(initialTripState, { type: 'location/resolved', place: TEHRAN });
check('location/resolved sets pickup and moves to ready', s.pickup === TEHRAN && s.phase === 'ready');

// Editing the pickup manually (the GPS-workaround flow).
s = dispatch(s, { type: 'picking/started', target: 'pickup' });
check('picking/started(pickup) opens the picker and remembers the return phase', s.phase === 'picking' && s.returnPhase === 'ready');

const manualPickup: Place = {
  coordinates: { lat: 35.71, lng: 51.34 },
  label: 'Manually placed pickup',
  source: 'map-pick',
};
s = dispatch(s, { type: 'picking/draft-moved', place: manualPickup });
s = dispatch(s, { type: 'picking/confirmed', place: manualPickup });
check('picking/confirmed(pickup) with no destination yet returns to ready', s.phase === 'ready' && s.pickup === manualPickup);

// Picking a destination.
s = dispatch(s, { type: 'picking/started', target: 'destination' });
s = dispatch(s, { type: 'picking/draft-moved', place: DESTINATION });
s = dispatch(s, { type: 'picking/confirmed', place: DESTINATION });
check(
  'picking/confirmed(destination) moves to routing and clears any stale trip progress',
  s.phase === 'routing' && s.destination === DESTINATION && s.selectedMode === null && s.rider === null,
);

const routes: RouteSet = {
  bicycle: makeRoute('bicycle', 3000, 700),
  walking: makeRoute('walking', 3000, 2200),
};
s = dispatch(s, { type: 'routes/resolved', routes });
check('routes/resolved moves to options', s.phase === 'options' && s.routes === routes);

check('activeRoute defaults to bicycle before a mode is chosen', activeRoute(s) === routes.bicycle);

s = dispatch(s, { type: 'mode/selected', mode: 'walking' });
check(
  'mode/selected only highlights the mode — it does not start a rider search',
  s.selectedMode === 'walking' && s.riderStatus === 'idle' && s.rider === null,
);
check('activeRoute follows the selected mode', activeRoute(s) === routes.walking);

s = dispatch(s, { type: 'rider/search-started' });
check('rider/search-started is a distinct, explicit step', s.riderStatus === 'loading');

// Moving the pickup mid-trip (correcting a bad fix after a route exists)
// invalidates the stale quote and re-enters routing.
s = dispatch(s, { type: 'picking/started', target: 'pickup' });
const correctedPickup: Place = {
  coordinates: { lat: 35.705, lng: 51.34 },
  label: 'Corrected pickup',
  source: 'map-pick',
};
s = dispatch(s, { type: 'picking/draft-moved', place: correctedPickup });
s = dispatch(s, { type: 'picking/confirmed', place: correctedPickup });
check(
  'picking/confirmed(pickup) with an existing destination re-enters routing and clears the stale quote',
  s.phase === 'routing' && s.pickup === correctedPickup && s.routes === null && s.selectedMode === null,
);

s = dispatch(s, { type: 'destination/cleared' });
check('destination/cleared resets to ready with no destination', s.phase === 'ready' && s.destination === null);

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exitCode = 1;
}
