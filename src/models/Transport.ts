/**
 * Transport modes the MVP supports. Adding a mode later means extending this
 * union and the catalogue in data/mock/transportOptions.ts — no component
 * needs to change.
 */
export type TransportMode = 'bicycle' | 'walking';

export interface TransportOption {
  mode: TransportMode;
  /** Name shown to the user. */
  label: string;
  /** One line explaining when this mode is the right pick. */
  description: string;
}
