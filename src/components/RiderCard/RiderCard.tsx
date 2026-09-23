import type { Rider } from '@/models';
import { BicycleIcon, StarIcon, WalkingIcon } from '@/components/ui/icons';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { FindingCourierAnimation } from './FindingCourierAnimation';
import { formatArrival, formatRating, initialsOf } from '@/utils/format';

const VEHICLE = {
  bicycle: { Icon: BicycleIcon, label: 'Bicycle' },
  walking: { Icon: WalkingIcon, label: 'On foot' },
} as const;

/**
 * The courier assigned to the trip. Mock data today, a dispatch response
 * tomorrow — the component only knows the Rider model.
 */
export function RiderCard({
  rider,
  loading,
  error,
  onRetry,
}: {
  rider: Rider | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (error) {
    return <ErrorNotice tone="inline" message={error} actionLabel="Try again" onAction={onRetry} />;
  }

  if (loading || !rider) {
    return <FindingCourierAnimation />;
  }

  const { Icon, label } = VEHICLE[rider.vehicleType];

  return (
    <div className="flex items-center gap-4 rounded-card border border-line bg-paper p-4">
      {rider.avatar ? (
        <img
          src={rider.avatar}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-body font-semibold text-ink"
          aria-hidden="true"
        >
          {initialsOf(rider.name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body font-semibold text-ink">{rider.name}</p>
          <span className="inline-flex items-center gap-1 text-meta text-slate">
            <StarIcon size={14} />
            <span className="tabular-nums">{formatRating(rider.rating)}</span>
            <span className="sr-only">out of 5</span>
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-meta text-slate">
          <Icon size={16} />
          {label}
        </p>
      </div>

      <p className="shrink-0 text-right text-meta font-semibold text-ink">
        {formatArrival(rider.estimatedArrivalMinutes)}
      </p>
    </div>
  );
}
