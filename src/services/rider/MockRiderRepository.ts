import type { Rider } from '@/models';
import { MOCK_RIDERS } from '@/data/mock/riders';
import type { RiderQuery, RiderRepository } from './RiderRepository';

/**
 * Picks a courier from the fixture roster.
 *
 * The choice is deterministic for a given pickup point, so the same trip keeps
 * the same courier instead of reshuffling on every re-render.
 */
export class MockRiderRepository implements RiderRepository {
  readonly id = 'mock';

  constructor(private readonly latencyMs = 500) {}

  async findNearestRider(query: RiderQuery, signal?: AbortSignal): Promise<Rider | null> {
    await this.delay(signal);

    const candidates = MOCK_RIDERS.filter((rider) => rider.vehicleType === query.mode);
    if (candidates.length === 0) return null;

    const seed = Math.abs(Math.round(query.pickup.lat * 1000 + query.pickup.lng * 1000));
    return candidates[seed % candidates.length];
  }

  private delay(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(resolve, this.latencyMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }
}
