import { Button } from './Button';

/**
 * The app's single error presentation: say what happened in plain words, and
 * offer the one action that fixes it. Technical detail never reaches here —
 * services translate their failures into human messages first.
 */
export function ErrorNotice({
  message,
  actionLabel,
  onAction,
  tone = 'card',
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 'card' floats over the map; 'inline' sits inside the sheet. */
  tone?: 'card' | 'inline';
}) {
  return (
    <div
      role="alert"
      className={
        tone === 'card'
          ? 'rounded-card border border-line bg-paper p-4 shadow-float'
          : 'rounded-card border border-line bg-mist p-4'
      }
    >
      <p className="text-body text-ink">{message}</p>
      {actionLabel && onAction ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
