import { MockRiderRepository } from './MockRiderRepository';
import { RiderService } from './RiderService';

export type { RiderRepository, RiderQuery } from './RiderRepository';
export { RiderService } from './RiderService';
export { MockRiderRepository } from './MockRiderRepository';
export { ApiRiderRepository } from './ApiRiderRepository';

/**
 * No dispatch backend exists yet (see README §Known limitations), so this
 * always wires up the fixture roster. Swapping in ApiRiderRepository here is
 * the one-line change services/index.ts already documents.
 */
export function createRiderService(): RiderService {
  return new RiderService(new MockRiderRepository());
}
