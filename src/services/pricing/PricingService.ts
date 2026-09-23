import type { PriceQuote, Route } from '@/models';
import { config } from '@/config/env';

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Courier Pay = MAX(Minimum Courier Pay, Base Pay + Distance(km) × Distance
 *                Rate + Estimated Time(min) × Time Rate)
 * Customer Price = Courier Pay × (1 + Platform Commission Rate),
 *                rounded to the nearest 1,000 Toman.
 *
 * Distance and time both come from the route actually calculated *for this
 * mode* (see RoutingService) — walking and bicycle routes can, and usually
 * do, differ in both, so each mode is priced from its own route, never a
 * shared or averaged one.
 *
 * Every rate is read from config.pricing (VITE_PRICING_* in .env — see
 * .env.example). Nothing about the formula's numbers is hardcoded here, so a
 * rate can be tuned per deployment without touching this file.
 */
export function quotePrice(route: Route): PriceQuote {
  const { mode, distanceMeters, durationSeconds } = route;
  const {
    minimumCourierPayToman,
    baseCourierPayToman,
    distanceRateTomanPerKm,
    timeRateTomanPerMinute,
    platformCommissionRate,
  } = config.pricing;

  const distanceKm = distanceMeters / 1000;
  const minutes = durationSeconds / 60;

  const courierDistancePay = distanceKm * distanceRateTomanPerKm;
  const courierTimePay = minutes * timeRateTomanPerMinute;
  const rawCourierPay = baseCourierPayToman + courierDistancePay + courierTimePay;
  const courierPayToman = Math.max(minimumCourierPayToman, rawCourierPay);

  const rawCustomerPrice = courierPayToman * (1 + platformCommissionRate);
  const totalToman = roundToNearest(rawCustomerPrice, 1000);

  return {
    mode,
    courierPayToman: Math.round(courierPayToman),
    totalToman,
    currency: 'IRT',
    breakdown: {
      courierBasePay: Math.round(baseCourierPayToman),
      courierDistancePay: Math.round(courierDistancePay),
      courierTimePay: Math.round(courierTimePay),
      courierPay: Math.round(courierPayToman),
      // Kept internally consistent with the rounded customer-facing total,
      // rather than a separately-rounded (and therefore slightly
      // inconsistent) commission figure.
      platformCommission: totalToman - Math.round(courierPayToman),
    },
  };
}
