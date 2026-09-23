import type { PriceQuote, Route, TransportOption } from '@/models';
import { BicycleIcon, WalkingIcon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistance, formatDuration, formatToman } from '@/utils/format';

const ICONS = {
  bicycle: BicycleIcon,
  walking: WalkingIcon,
} as const;

/**
 * One transport choice: mode, distance, ETA and fare together, so comparing
 * bicycle and walking is a single glance. Selection is carried by a black
 * fill and a check, not by colour alone, so it survives greyscale and
 * low-vision use.
 *
 * Rendered as a radio so a keyboard user gets arrow-key selection for free.
 */
export function TransportOptionRow({
  option,
  route,
  price,
  loading,
  selected,
  onSelect,
}: {
  option: TransportOption;
  route: Route | null;
  price: PriceQuote | null;
  loading: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = ICONS[option.mode];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        'flex w-full items-center gap-4 rounded-card border p-4 text-left',
        'transition-[background-color,border-color,transform] duration-200 ease-spring',
        'motion-safe:active:scale-[0.99]',
        selected ? 'border-brand bg-brand text-paper' : 'border-line bg-paper text-ink',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-11 w-11 shrink-0 place-items-center rounded-full border',
          selected ? 'border-paper/30' : 'border-line',
        ].join(' ')}
      >
        <Icon size={24} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold">{option.label}</span>
        <span
          className={
            selected ? 'block truncate text-meta text-paper/60' : 'block truncate text-meta text-slate'
          }
        >
          {route ? `${formatDistance(route.distanceMeters)} · ${option.description}` : option.description}
        </span>
      </span>

      <span className="shrink-0 text-right">
        {loading || !route ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <>
            <span className="block text-title tabular-nums">{formatDuration(route.durationSeconds)}</span>
            {price ? (
              <span
                className={
                  selected
                    ? 'block text-meta tabular-nums text-paper/70'
                    : 'block text-meta tabular-nums text-slate'
                }
              >
                {formatToman(price.totalToman)}
              </span>
            ) : null}
          </>
        )}
      </span>
    </button>
  );
}
