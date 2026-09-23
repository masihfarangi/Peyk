import { AddToHomeIcon, CloseIcon, ShareIcon } from './icons';

/**
 * A quiet suggestion, never a modal and never automatic on first paint.
 * Chromium gets a real install button; iOS Safari gets the Share-sheet steps,
 * because it has no install API.
 */
export function InstallHint({
  canInstall,
  showIosHint,
  onInstall,
  onDismiss,
}: {
  canInstall: boolean;
  showIosHint: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  if (!canInstall && !showIosHint) return null;

  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-paper/95 p-3 shadow-float backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink">
        <AddToHomeIcon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-meta font-semibold text-ink">Add Peyk to your home screen</p>
        {showIosHint ? (
          <p className="mt-0.5 flex items-center gap-1 text-meta text-slate">
            Tap <ShareIcon size={14} /> then “Add to Home Screen”
          </p>
        ) : (
          <p className="mt-0.5 text-meta text-slate">Opens full screen, like an app</p>
        )}
      </div>

      {canInstall ? (
        <button
          type="button"
          onClick={onInstall}
          className="min-h-[40px] shrink-0 rounded-pill bg-brand px-4 text-meta font-semibold text-paper active:bg-brandActive"
        >
          Add
        </button>
      ) : null}

      <button
        type="button"
        onClick={onDismiss}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate active:bg-mist"
        aria-label="Dismiss"
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}
