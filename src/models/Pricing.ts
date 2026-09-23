import type { TransportMode } from './Transport';

export interface PriceBreakdown {
  /** The flat portion of the courier's pay. */
  courierBasePay: number;
  /** Distance(km) × distance rate. */
  courierDistancePay: number;
  /** Time(min) × time rate. */
  courierTimePay: number;
  /** MAX(minimum courier pay, base + distance pay + time pay). */
  courierPay: number;
  /** The platform's cut — the difference between the customer price and the courier pay. */
  platformCommission: number;
}

export interface PriceQuote {
  mode: TransportMode;
  /** What the courier is paid, in Toman (IRT) — before rounding. */
  courierPayToman: number;
  /** What the customer pays: courierPay × (1 + commission), rounded to the nearest 1,000. */
  totalToman: number;
  currency: 'IRT';
  breakdown: PriceBreakdown;
}
