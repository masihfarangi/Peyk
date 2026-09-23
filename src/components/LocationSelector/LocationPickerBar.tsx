import type { Place } from '@/models';
import type { PickingTarget } from '@/state/tripReducer';
import { Button } from '@/components/ui/Button';

/**
 * Confirmation bar for the drop-pin picker. Shared by the pickup point and
 * the destination: the user moves the map under the fixed centre pin, reads
 * back the address here, and confirms. One thumb, one tap, no small targets
 * on the map itself.
 */
export function LocationPickerBar({
  target,
  draft,
  onConfirm,
  onCancel,
}: {
  target: PickingTarget;
  draft: Place | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = target === 'pickup' ? 'Pickup point' : 'Drop-off point';
  const confirmLabel = target === 'pickup' ? 'Set pickup' : 'Set destination';

  return (
    <div className="rounded-sheet border border-line bg-paper p-5 shadow-sheet">
      <p className="text-meta text-slate">{title}</p>
      <p className="mt-1 truncate text-title text-ink" aria-live="polite">
        {draft?.label ?? 'Move the map'}
      </p>
      {draft?.detail ? <p className="mt-1 truncate text-meta text-slate">{draft.detail}</p> : null}

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="px-6">
          Cancel
        </Button>
        <Button onClick={onConfirm} block disabled={!draft}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
