/**
 * The app's one loading indicator outside of skeletons: a single-stroke ring,
 * in the same 1.75px line-art language as every icon.
 */
export function Spinner({ label, size = 28 }: { label?: string; size?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="motion-safe:animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.5" stroke="#E3E3E3" strokeWidth="1.75" />
        <path
          d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
          stroke="#CB2027"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="text-meta text-slate">{label}</span> : null}
      {!label ? <span className="sr-only">Loading</span> : null}
    </div>
  );
}
