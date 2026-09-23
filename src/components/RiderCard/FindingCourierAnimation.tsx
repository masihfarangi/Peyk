import { BicycleIcon } from '@/components/ui/icons';

/**
 * A bike rides back and forth along a dotted road while a courier search is
 * in flight. Pure CSS (see the `peyk-ride` keyframes in index.css) rather
 * than a JS animation loop, so it costs nothing on the main thread and
 * respects `prefers-reduced-motion` the same way every other motion in the
 * app does — the reduced-motion rule collapses the animation to its resting
 * frame instead of stopping it mid-ride.
 */
export function FindingCourierAnimation() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-card border border-line bg-mist px-4 py-6"
    >
      <div className="relative h-11 w-full max-w-[220px]">
        <div
          className="absolute inset-x-0 top-1/2 h-[2px] opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, #000 0, #000 6px, transparent 6px, transparent 14px)',
          }}
          aria-hidden="true"
        />

        <div
          className="absolute left-0 top-1/2 motion-safe:animate-[peyk-ride_2.4s_ease-in-out_infinite]"
          style={{ transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-brand bg-paper text-brand shadow-float">
            <BicycleIcon size={22} />
          </span>
        </div>
      </div>

      <p className="text-meta text-slate">Finding a nearby courier…</p>
      <span className="sr-only">Searching for an available courier</span>
    </div>
  );
}
