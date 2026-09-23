import { useCallback, useState } from 'react';
import { config } from '@/config/env';
import { TRANSPORT_OPTIONS } from '@/data/mock/transportOptions';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useTripController } from '@/hooks/useTripController';
import { useAuth } from '@/state/AuthContext';
import { MapCanvas } from '@/components/Map/MapCanvas';
import { BottomSheet } from '@/components/BottomSheet/BottomSheet';
import { RoutePanel } from '@/components/LocationSelector/RoutePanel';
import { LocationPickerBar } from '@/components/LocationSelector/LocationPickerBar';
import { TransportOptionRow } from '@/components/TransportOption/TransportOptionRow';
import { RiderCard } from '@/components/RiderCard/RiderCard';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { InstallHint } from '@/components/ui/InstallHint';

/**
 * The only screen in the MVP: map first, everything else floating over it.
 *
 * All sequencing lives in useTripController; this file is composition and
 * layout. The map sits underneath at all times, and the panel at the top plus
 * the sheet at the bottom stay within thumb reach on a phone.
 */
export function HomePage() {
  const { state, route, prices, actions } = useTripController();
  const { logout } = useAuth();
  const install = useInstallPrompt();
  const [sheetHeight, setSheetHeight] = useState(0);

  const picking = state.phase === 'picking';
  const sheetOpen = state.phase === 'routing' || state.phase === 'options';
  const routesLoading = state.routeStatus === 'loading';
  const searchingForCourier = state.riderStatus === 'loading' || state.riderStatus === 'ready';

  const mapCenter = state.pickup?.coordinates ?? config.location.defaultCenter;

  const installVisible = install.canInstall || install.showIosHint;

  // How much of the map's bottom edge is covered, so the recenter button and
  // any route fit stay clear of whatever is floating down there.
  const bottomInset = picking ? 180 : sheetOpen ? sheetHeight : installVisible ? 96 : 0;

  const handleVisibleHeight = useCallback((height: number) => setSheetHeight(height), []);

  const locationErrorAction =
    state.locationError?.code === 'location/denied' ? 'Allow location' : 'Try again';

  return (
    <div className="peyk-frame h-full">
      <main className="peyk-stage">
        <MapCanvas
          center={mapCenter}
          pickup={state.pickup}
          destination={state.destination}
          route={route}
          mode={state.selectedMode ?? 'bicycle'}
          pickingTarget={picking ? state.pickingTarget : null}
          bottomInset={bottomInset}
          onCenterChanged={actions.moveDraftPlace}
          onRecenter={actions.locate}
        />

        {/* Top layer: what the trip is. Hidden while picking so the map and
            the centre pin have the screen to themselves. */}
        {!picking ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[600] space-y-3 p-4"
            style={{ paddingTop: 'calc(16px + var(--peyk-safe-top))' }}
          >
            <div className="pointer-events-auto flex justify-end">
              <button
                type="button"
                onClick={logout}
                className="rounded-pill border border-line bg-paper/95 px-3 py-1.5 text-meta font-semibold text-slate shadow-float backdrop-blur active:bg-mist"
              >
                Log out
              </button>
            </div>

            <div className="pointer-events-auto">
              <RoutePanel
                pickup={state.pickup}
                destination={state.destination}
                locating={state.locationStatus === 'loading'}
                onEditPickup={() => actions.startPicking('pickup')}
                onEditDestination={() => actions.startPicking('destination')}
                onClearDestination={actions.clearDestination}
              />
            </div>

            {state.locationStatus === 'error' && state.locationError ? (
              <div className="pointer-events-auto">
                <ErrorNotice
                  message={state.locationError.message}
                  actionLabel={locationErrorAction}
                  onAction={actions.locate}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Bottom layer: either the pin confirmation, or the options sheet. */}
        {picking && state.pickingTarget ? (
          <div
            className="absolute inset-x-0 bottom-0 z-[600] p-4"
            style={{ paddingBottom: 'calc(16px + var(--peyk-safe-bottom))' }}
          >
            <LocationPickerBar
              target={state.pickingTarget}
              draft={state.draftPlace}
              onConfirm={actions.confirmPicking}
              onCancel={actions.cancelPicking}
            />
          </div>
        ) : (
          <BottomSheet
            open={sheetOpen}
            label="Transport options"
            peekHeight={196}
            onVisibleHeightChange={handleVisibleHeight}
          >
            <h2 className="text-title text-ink">How should it travel?</h2>

            {state.routeStatus === 'error' && state.routeError ? (
              <div className="mt-4">
                <ErrorNotice
                  tone="inline"
                  message={state.routeError.message}
                  actionLabel="Try again"
                  onAction={actions.retryRoutes}
                />
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Transport options"
                aria-busy={routesLoading}
                className="mt-4 space-y-3"
              >
                {TRANSPORT_OPTIONS.map((option) => (
                  <TransportOptionRow
                    key={option.mode}
                    option={option}
                    route={state.routes?.[option.mode] ?? null}
                    price={prices?.[option.mode] ?? null}
                    loading={routesLoading}
                    selected={state.selectedMode === option.mode}
                    onSelect={() => actions.selectMode(option.mode)}
                  />
                ))}
              </div>
            )}

            {/* Choosing a mode only highlights it — finding a courier is a
                separate, explicit step, so comparing bicycle vs walking
                never triggers a search on its own. */}
            {state.selectedMode ? (
              <div className="mt-5 border-t border-line pt-5">
                {searchingForCourier ? (
                  <>
                    <p className="mb-3 text-meta text-slate">Your courier</p>
                    <RiderCard
                      rider={state.rider}
                      loading={state.riderStatus === 'loading'}
                      error={state.riderError?.message ?? null}
                      onRetry={actions.findCourier}
                    />
                    <p className="mt-3 text-meta text-ash">
                      Estimates only. Booking arrives in the next release.
                    </p>
                  </>
                ) : (
                  <Button block onClick={actions.findCourier}>
                    Find a courier
                  </Button>
                )}
              </div>
            ) : null}

            <p className="sr-only" aria-live="polite">
              {routesLoading
                ? 'Calculating the route'
                : state.routes
                  ? 'Routes ready. Choose bicycle or walking.'
                  : ''}
            </p>
          </BottomSheet>
        )}

        {/* The install nudge waits until the map is doing nothing else. */}
        {!picking && !sheetOpen && installVisible ? (
          <div
            className="absolute inset-x-0 bottom-0 z-[550] p-4"
            style={{ paddingBottom: 'calc(16px + var(--peyk-safe-bottom))' }}
          >
            <InstallHint
              canInstall={install.canInstall}
              showIosHint={install.showIosHint}
              onInstall={() => void install.install()}
              onDismiss={install.dismiss}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
