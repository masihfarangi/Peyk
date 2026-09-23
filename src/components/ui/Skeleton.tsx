/** Neutral placeholder block. Sized by the caller. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`motion-safe:animate-pulse rounded-lg bg-mist ${className}`}
      aria-hidden="true"
    />
  );
}
