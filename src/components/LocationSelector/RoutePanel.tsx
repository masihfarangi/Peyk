import type { Place } from '@/models';
import { CloseIcon, CrosshairIcon, PinIcon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/Spinner';

/** Above this, a GPS fix is treated as unreliable enough to flag. */
const LOW_ACCURACY_THRESHOLD_M = 1000;

/**
 * What the trip is, always visible above the map: the pickup point (editable,
 * so a bad GPS fix is never a dead end) and the destination (a "Where to?"
 * prompt until one is set, then an editable label with a clear button).
 */
export function RoutePanel({
  pickup,
  destination,
  locating,
  onEditPickup,
  onEditDestination,
  onClearDestination,
}: {
  pickup: Place | null;
  destination: Place | null;
  locating: boolean;
  onEditPickup: () => void;
  onEditDestination: () => void;
  onClearDestination: () => void;
}) {
  const lowAccuracy =
    pickup?.source === 'gps' &&
    typeof pickup.accuracyMeters === 'number' &&
    pickup.accuracyMeters > LOW_ACCURACY_THRESHOLD_M;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-card border border-line bg-paper/95 p-3 shadow-float backdrop-blur">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink">
          <CrosshairIcon size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-meta text-slate">Pickup</p>
          {locating ? (
            <span className="flex items-center gap-2 text-body text-ink">
              <Spinner size={14} />
              Finding your location…
            </span>
          ) : (
            <p className="truncate text-body font-semibold text-ink">
              {pickup?.label ?? 'Set your pickup point'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onEditPickup}
          className="shrink-0 rounded-pill border border-line px-3 py-1.5 text-meta font-semibold text-ink active:bg-mist"
        >
          Edit
        </button>
      </div>

      {lowAccuracy ? (
        <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-paper/95 px-3 py-2 shadow-float backdrop-blur">
          <p className="text-meta text-slate">This fix looks approximate.</p>
          <button
            type="button"
            onClick={onEditPickup}
            className="shrink-0 text-meta font-semibold text-ink underline underline-offset-2"
          >
            Set manually
          </button>
        </div>
      ) : null}

      {destination ? (
        <div className="flex items-center gap-3 rounded-card border border-line bg-paper/95 p-3 shadow-float backdrop-blur">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink">
            <PinIcon size={18} />
          </span>

          <button type="button" onClick={onEditDestination} className="min-w-0 flex-1 text-left">
            <p className="text-meta text-slate">Drop-off</p>
            <p className="truncate text-body font-semibold text-ink">{destination.label}</p>
          </button>

          <button
            type="button"
            onClick={onClearDestination}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate active:bg-mist"
            aria-label="Clear destination"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditDestination}
          disabled={!pickup}
          className="flex w-full items-center gap-3 rounded-card border border-line bg-paper/95 p-3 text-left shadow-float backdrop-blur transition-opacity disabled:opacity-50"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink">
            <PinIcon size={18} />
          </span>
          <span className="text-body font-semibold text-ink">Where to?</span>
        </button>
      )}
    </div>
  );
}
