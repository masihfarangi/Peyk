# Peyk — courier client (MVP)

A mobile-first Progressive Web App for a local courier service. Set a pickup
point and a destination, and Peyk shows you what it costs in time to move a
parcel across town by **bicycle** or **on foot**, with the courier who would
take it.

This repository contains the **client side only**. The courier/rider app is a
separate surface and is not part of this MVP.

It is a real web app, not a mockup: it asks for your location, draws an Iranian
map, calculates a route, and works offline as an installed app.

---

## Quick start

```bash
npm install
npm run dev
```

Then open the printed network URL on your phone (both devices on the same
Wi-Fi). No configuration is needed for the first run — the app falls back to
OpenStreetMap tiles, mock routing and mock couriers.

```bash
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
npm run typecheck # TypeScript, no emit
npm run smoke     # headless checks of the flow, routing and formatting
```

`npm run smoke` bundles `test/smoke.ts` and runs it in Node. It walks the trip
state machine (including the pickup/destination picker and the decoupled
courier search), the pricing formula, and the geo/formatting utilities — 31
checks, no browser needed. This is a smaller suite than earlier revisions of
this file described; see the comment at the top of `test/smoke.ts`.

> **Location needs HTTPS.** `navigator.geolocation` only works in a secure
> context. `localhost` counts as secure, so `npm run dev` works on your own
> machine — but opening the dev server from your phone over `http://192.168.x.x`
> will *not* prompt for location. See [Testing on a real phone](#testing-on-a-real-phone).

---

## What it does

1. Opens on a boot splash while the bundle parses.
2. Shows a login/signup screen first (see [Accounts](#accounts) below) — the
   map, location, and everything past it only load after there's a session.
3. Asks for location permission and explains why it needs it. If the fix is
   missing, denied, or looks approximate (an accuracy warning appears above a
   set threshold), you can set the pickup point by hand the same way as the
   destination — see step 5.
4. Centres the map on you and uses that as the pickup point.
5. You tap the pickup or destination field, move the map under the centre
   pin, and confirm. Editing the pickup after a destination is already set
   re-routes automatically.
6. Both routes are calculated — each with a fare quote (courier pay from
   distance + time, plus the platform's commission — see
   [Pricing](#configuration)) — and the bottom sheet slides up.
7. You pick bicycle or walking to compare ETA and price; the choice is
   highlighted and the route redraws. A "Find a courier" button appears once
   a mode is chosen.
8. Tapping it searches for a courier (with a riding-bike animation while it
   looks), then shows the assigned courier with name, rating, vehicle and
   arrival time.

Deliberately **not** built, per the brief: real accounts (see below — what
exists is a mocked login), payments, wallet, chat, ratings, order history,
profiles beyond a name/phone, notifications, coupons, referrals, admin, the
rider app, real courier matching, or a backend.

## Accounts

`src/pages/Auth/AuthPage.tsx` is the app's front door — signed-out users see
only this, in Persian/RTL, with the two tabs the standalone prototype
(`login-register.rar`) shipped:

- **ورود (Login)** — phone number, then a 4-digit one-time code. There's no
  SMS provider wired up, so the code is always `1234` (shown to the user in a
  toast, exactly like the prototype did) — swap `AuthPage`'s OTP check for a
  real verification call when one exists.
- **ثبت‌نام (Signup)** — full name, کد ملی (validated with the real Iranian
  national-ID checksum), and phone. Written to `localStorage` as a mock user
  record; a duplicate کد ملی is rejected.

`src/state/AuthContext.tsx` is the single source of truth both the gate
(`App.tsx`) and the form read/write — session state lives in `localStorage`
under `peyk.auth.session`, so a reload stays logged in. There's a "Log out"
button in the top-right corner of the map screen for testing the loop.
Everything here — the phone-only identity, the fixed OTP, the client-side
"database" — is a placeholder for a real auth backend; nothing about the trip
flow depends on how a session was created, only that one exists.

---

## Configuration

Copy the example file and fill in what you have:

```bash
cp .env.example .env
```

Everything is optional. With an empty file you get OSM tiles + real street
routing (see below) + mock couriers, which exercises the entire flow.

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_MAP_PROVIDER` | `neshan` or `osm` | `neshan`, auto-downgraded to `osm` without a key |
| `VITE_MAP_API_KEY` | Neshan **web** key | empty |
| `VITE_MAP_TYPE` | Neshan style name | `standard-day` |
| `VITE_ROUTING_PROVIDER` | `osrm`, `mock`, `neshan` or `proxy` | `osrm` |
| `VITE_ROUTING_API_KEY` | Neshan **service** key | empty |
| `VITE_ROUTING_PROXY_URL` | Your backend's base URL | empty |
| `VITE_GEOCODING_PROVIDER` | `none` or `neshan` | `none` |
| `VITE_GEOCODING_API_KEY` | Neshan service key for addresses | falls back to `VITE_ROUTING_API_KEY` |
| `VITE_DEFAULT_LAT` / `_LNG` | Map centre before the first fix | Ferdowsi Square, Tehran |
| `VITE_USE_MOCK_LOCATION` | Skip real GPS (dev) | `false` |

Misconfiguration never breaks the app. Ask for Neshan without a key and you get
OSM; ask for `proxy` without a URL and you get mock routes. The downgrade is
silent to the user and visible to you in `src/config/env.ts`.

### Adding a map API key

1. Create an account at [platform.neshan.org](https://platform.neshan.org).
2. Create a **web (map)** key — this is the one that renders tiles.
3. Restrict it to your production domain in the Neshan panel.
4. Put it in `.env`:

   ```ini
   VITE_MAP_PROVIDER=neshan
   VITE_MAP_API_KEY=web.xxxxxxxxxxxxxxxx
   ```

The Neshan SDK is a Leaflet fork hosted on `static.neshan.org`. It is injected
at runtime the first time a map mounts, so choosing `osm` means it is never
downloaded at all.

### Adding a routing API key

```ini
VITE_ROUTING_PROVIDER=neshan
VITE_ROUTING_API_KEY=service.xxxxxxxxxxxxxxxx
```

Fine for development and demos. For production use the proxy instead — see
[Which keys are safe in the browser?](#which-keys-are-safe-in-the-browser)

---

## Routing, honestly

**The default is real street routing, no key required.**
`OsrmRoutingService` calls the free public OSRM instance at
`routing.openstreetmap.de`, which — unlike the official project-osrm.org demo
(car only) — runs dedicated `bike` and `foot` profiles. The geometry follows
actual streets and footpaths, and distance/duration are computed for the
requested mode directly, not re-timed from a different one. It's a public,
rate-limited (~1 req/s) demo instance meant for reasonable, non-commercial
use — point `ProxyRoutingService` at your own OSRM/Valhalla/Mapbox deployment
before you rely on it for production traffic.

**Neshan's direction API has no bicycle or pedestrian profile.** It offers
`car` and `motorcycle` only. If you set `VITE_ROUTING_PROVIDER=neshan`,
`NeshanRoutingService` asks for the **motorcycle** profile — it follows the
narrow streets and shortcuts a courier actually uses — then takes its geometry
and distance and applies our own speed profile to get the duration. Neshan's
own ETA is a motor vehicle's ETA: wrong for a bicycle, badly wrong on foot.
Prefer `osrm` unless you specifically need Neshan's Iran-tuned street data.

The speeds live in one place, `src/services/routing/RoutingService.ts`:

```ts
export const SPEED_MPS = {
  bicycle: 4.0,   // ~14.4 km/h, city cycling including lights
  walking: 1.35,  // ~4.9 km/h
};
```

These are only used by `NeshanRoutingService` (to re-time the motorcycle
route) and by `MockRoutingService`'s `speed` mode. `OsrmRoutingService`
doesn't need them — it gets a real per-mode duration back from the routing
engine itself.

### The mock provider

`MockRoutingService` needs no network and is the automatic fallback if
`osrm` (or whichever provider is configured) fails — see `withMockFallback`
in `src/services/routing/index.ts`. It has two modes:

- `speed` (default) — derives distance and duration from the two points, so the
  times change as you move the destination.
- `fixed` — always returns the brief's demo numbers, 45 min and 1 hr 15 min.
  Handy for screenshots. Set it in `src/services/routing/index.ts`:
  `new MockRoutingService('fixed')`.

Its geometry is a gentle curve, not a street-accurate path — a deliberate
fallback shape, not what you should expect to see day to day now that `osrm`
is the default.

### Writing the routing proxy

`ProxyRoutingService` expects one endpoint:

```
GET {VITE_ROUTING_PROXY_URL}/route
    ?mode=bicycle|walking&originLat=&originLng=&destLat=&destLng=
->  { "distanceMeters": 4210, "durationSeconds": 1052,
      "geometry": [{ "lat": 35.7, "lng": 51.4 }, ...] }
```

A minimal Express implementation, with the secret staying server-side:

```js
import express from 'express';

const app = express();

app.get('/route', async (req, res) => {
  const { mode, originLat, originLng, destLat, destLng } = req.query;

  const upstream = await fetch(
    `https://api.neshan.org/v4/direction?type=motorcycle` +
      `&origin=${originLat},${originLng}&destination=${destLat},${destLng}`,
    { headers: { 'Api-Key': process.env.NESHAN_SERVICE_KEY } }, // never shipped to the browser
  );

  if (!upstream.ok) return res.status(502).json({ error: 'routing_failed' });

  const data = await upstream.json();
  const leg = data.routes?.[0]?.legs?.[0];
  const distanceMeters = leg?.distance?.value ?? 0;
  const speed = mode === 'walking' ? 1.35 : 4.0;

  res.json({
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / speed),
    geometry: decodePolyline(data.routes[0].overview_polyline.points), // [{lat,lng}]
  });
});

app.listen(8080);
```

Then set `VITE_ROUTING_PROVIDER=proxy` and `VITE_ROUTING_PROXY_URL=https://…`.
Nothing in the UI changes.

---

## Security

### Which keys are safe in the browser?

| Key | Where it belongs | Why |
| --- | --- | --- |
| Neshan **web/map** key (`VITE_MAP_API_KEY`) | **Client — safe** | Designed to be public. It renders tiles and is restricted by domain in the Neshan panel. |
| Neshan **service** key (`VITE_ROUTING_API_KEY`, `VITE_GEOCODING_API_KEY`) | **Server — not safe long term** | Grants paid API calls. In the bundle it is readable by anyone and cannot be domain-restricted reliably. Acceptable for an MVP demo; move it behind the proxy before launch. |
| Anything else (dispatch credentials, DB, payment) | **Server only** | Never introduce a `VITE_` variable for these. |

**Every `VITE_*` variable is compiled into the JavaScript bundle.** Treat the
prefix as meaning "public". A variable without the prefix is simply not visible
to the app, which is the correct place for a secret.

The app is built so this migration costs nothing: swap the routing provider to
`proxy` and the secret leaves the client entirely.

### HTTPS

Geolocation, service workers and installability all require a secure context.
Host over HTTPS. There is no fallback, and there shouldn't be.

---

## PWA

A real one, hand-written rather than generated by a plugin:

- `public/manifest.webmanifest` — standalone display, portrait, theme and
  background colours, `any` + `maskable` icons at 192 and 512.
- `public/sw.js` — network-first for navigation with a cached shell fallback,
  cache-first for hashed build assets, stale-while-revalidate for icons.
  **Map tiles, routing and geocoding are never cached** — a stale route is
  worse than no route.
- `src/registerServiceWorker.ts` — registers only in production, only in a
  secure context, and never throws if registration is unavailable.
- Icons are generated from the app mark: a bicycle carrying a parcel, drawn in
  the same single-weight line art as every icon in the interface.

### Installing it

**Android / Chrome** — a subtle "Add Peyk to your home screen" card appears once
the browser offers installation. It is dismissible and never blocks the app; the
dismissal is remembered. Or use ⋮ → *Install app*.

**iOS / Safari** — Safari has no install API, so the card shows the manual steps
instead: Share → *Add to Home Screen*.

**Desktop Chrome / Edge** — the install icon in the address bar.

Once installed it opens standalone: no browser chrome, own icon, own splash.

### Updating a deployed app

Bump `VERSION` in `public/sw.js` when you change the shell. Old caches are
deleted on activation.

---

## Hosting

The build is plain static files. Any static host works — Netlify, Vercel, GitHub
Pages, Liara, ArvanCloud, nginx, Caddy.

```bash
npm run build   # -> dist/
```

Two things to get right:

1. **HTTPS**, for the reasons above.
2. **SPA fallback** — serve `index.html` for unknown paths.

nginx:

```nginx
server {
  listen 443 ssl;
  root /var/www/peyk/dist;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Hashed assets are immutable; the shell must not be.
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
  location = /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

`vite.config.ts` uses `base: './'`, so the app also works from a sub-path
(`https://example.com/peyk/`) with no rebuild — and from the `file://`-style
scheme a Capacitor WebView uses.

---

## Testing on a real phone

Geolocation needs HTTPS, and a plain LAN dev URL is not secure. Options:

1. **A tunnel** (easiest): run `npm run dev`, then expose it with any HTTPS
   tunnel (`cloudflared tunnel --url http://localhost:5173`, ngrok, etc.) and
   open the HTTPS URL on the phone. Real GPS, real permission prompt.
2. **Chrome remote debugging**: `chrome://inspect` with the phone on USB, using
   `http://localhost:5173` forwarded — localhost counts as secure.
3. **No GPS at all**: set `VITE_USE_MOCK_LOCATION=true` to work from a fixed
   point. The rest of the flow behaves identically.

---

## Packaging for Android with Capacitor

The web app is already Capacitor-compatible; nothing here has to be rewritten.
When you are ready:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init "Peyk" "org.peyk.client" --web-dir=dist

npm install @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Then, in the generated Android project:

1. Add the location permissions to `android/app/src/main/AndroidManifest.xml`:

   ```xml
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   ```

2. Consider `@capacitor/geolocation`, which gives you the native permission
   dialog. `BrowserLocationService` already isolates every geolocation call, so
   adding a `CapacitorLocationService` alongside it is one new file plus one
   line in `src/services/location/index.ts`.

3. Re-run `npx cap sync` after every `npm run build`.

**Why it already works:** the build uses relative paths; the service worker
registration is guarded and optional; no code assumes a specific origin or
`window.location.host`; the map SDK is loaded over HTTPS from an absolute URL;
and there are no browser-only APIs in the critical path that a WebView lacks.

---

## Architecture

```
src/
  components/
    Map/               MapCanvas — the only component holding a map handle
    BottomSheet/       draggable sheet, pointer events, no gesture library
    LocationSelector/  RoutePanel, LocationPickerBar
    TransportOption/   TransportOptionRow
    RiderCard/         RiderCard, FindingCourierAnimation
    ui/                Button, LogoMark, Spinner, Skeleton, ErrorNotice, InstallHint, icons
  pages/
    Auth/              AuthPage (login + signup tabs), validation
    Home/              HomePage — composition and layout only
  services/
    map/               MapProvider interface, Neshan + OSM implementations
    routing/           RoutingService, mock + OSRM + Neshan + proxy
    location/          LocationService, browser + mock
    geocoding/         GeocodingService, Neshan + coordinate fallback
    rider/             RiderRepository, RiderService, mock + api
    pricing/           the fare formula (see Configuration)
    index.ts           the service container
  state/
    tripReducer.ts     the whole trip flow as a pure state machine
    AuthContext.tsx    mock session state, backed by localStorage
    ServicesContext.tsx
  hooks/               useTripController, useMapProvider, useInstallPrompt
  models/              Location, Route, Rider, Transport, Pricing
  data/mock/           riders, routes, transport options
  utils/               format, geo, polyline, errors, loadExternalScript
  config/env.ts        the only file that reads import.meta.env
  theme/tokens.css     design tokens shared with non-Tailwind surfaces
  App.tsx              the auth gate: AuthPage, or ServicesProvider + HomePage
```

The rules this follows:

**UI → Service → Repository → Backend.** Components never call `fetch`, never
touch Leaflet, and never read environment variables. `MockRiderRepository`
becomes `ApiRiderRepository` by changing one line in
`src/services/rider/index.ts`; no component knows the difference.

**The flow is a pure reducer.** `src/state/tripReducer.ts` imports no React and
no services. Every transition — a late GPS fix arriving while the user is
already picking a destination, a mode change invalidating the current courier —
is decided there and can be reasoned about without mounting anything.

**The map is behind an interface.** `MapProvider` has no Leaflet, Neshan or tile
types in its signature. Swapping in Balad or MapLibre means writing one class
and changing one line in `src/services/map/index.ts`.

**Errors are translated at the service boundary.** Services throw `AppError`
with a message already written for a person plus a machine-readable code. No
technical string ever reaches the interface.

---

## Design notes

Black and white only — true `#000000`, not a tinted near-black — with one type
family and generous space.

The identity is spent in one place: a single continuous **1.75px line-art
stroke**, used for the app mark, every icon, the map markers, and the route
line itself. Cycling draws a solid line, walking a dotted trail, so the mode you
picked is legible on the map without a legend and without colour.

Selection is carried by a black fill plus a change in shape, never by colour
alone, so the interface survives greyscale and low-vision use. Touch targets are
at least 48px. Focus states are visible. `prefers-reduced-motion` is respected
throughout. The one non-user-triggered motion is the boot splash drawing the
mark once.

Layout targets 360–430px. On tablets the same layout breathes; on desktop it
stays centred in a phone-width stage rather than stretching, because a map app
stretched across 1440px is nobody's idea of a good time.

---

## Known limitations

- Mock routes are curves, not streets, and are now only a fallback (used when
  the configured provider fails) rather than the default.
- Neshan re-times motorcycle routes for bike and walking (see above); prefer
  `osrm`.
- routing.openstreetmap.de and the OSM tile server are both public demo
  services, rate-limited and not for production traffic.
- Courier data is a fixture; no real dispatch exists.
- There is no booking step — the flow ends at the courier card, by design.
- Pricing (`src/services/pricing/`) follows the exact spec formula and is
  fully configurable via `VITE_PRICING_*` — see `.env.example` — but there is
  no real admin UI yet; the `.env` file is the settings surface for now.
- GPS accuracy is still whatever the device and network can produce.
  `BrowserLocationService` takes the best of a short window of fixes and
  flags a clearly approximate one, but it cannot fix a device with no real
  location signal — that's what the manual pickup picker is for.
- Auth is entirely mocked (see the Accounts section above): a fixed OTP, no
  password, no SMS, and users are a JSON array in `localStorage`. It's enough
  to gate the trip flow behind a session for demos and testing, and nothing
  else in the app assumes more than "a session exists" — but it is not a real
  identity system and shouldn't be treated as one past this MVP.
