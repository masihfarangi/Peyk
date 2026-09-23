import type { SVGProps } from 'react';

/* ------------------------------------------------------------------------ *
 * Two kinds of icons live in this file:
 *
 *  1. Hand-drawn line icons (below), built from raw <path>/<circle> elements
 *     on a shared 24px/1.75-stroke grid, tinted via `currentColor`.
 *
 *  2. Pasted-in source icons (bike courier, walking courier, starting point,
 *     ending point) — these are `.svg` FILES imported as image assets, not
 *     inline markup. That's the fix for the error you hit: you can't put a
 *     Windows file path inside `{...}` and have it magically inline the
 *     file's contents — JSX expects a JS *value* there (a string, a
 *     variable, etc.), and `import ... from './path.svg'` is what turns the
 *     file into that value (a URL Vite serves the file at).
 *
 *     To swap one of the four source icons:
 *       1. Save the .svg file under src/components/ui/Icon/ (already the
 *          case for bike_courier.svg, based on your error message).
 *       2. Make sure the `import` line below for that icon points at the
 *          exact filename you saved.
 *       3. That's it — no JSX changes needed.
 * ------------------------------------------------------------------------ */

import bikeCourierSrc from './Icon/bike_courier.svg';
import walkingCourierSrc from './Icon/walking_courier.svg';
import startingPointSrc from './Icon/starting_point.svg';
import endingPointSrc from './Icon/ending_point.svg';

type SourceIconProps = { size?: number; className?: string };

function SourceIcon({ src, size = 24, className }: SourceIconProps & { src: string }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}

/** Bike courier. Source: src/components/ui/Icon/bike_courier.svg */
export function BicycleIcon(props: SourceIconProps) {
  return <SourceIcon src={bikeCourierSrc} {...props} />;
}

/** Walking courier. Source: src/components/ui/Icon/walking_courier.svg */
export function WalkingIcon(props: SourceIconProps) {
  return <SourceIcon src={walkingCourierSrc} {...props} />;
}

/** Starting point (pickup). Source: src/components/ui/Icon/starting_point.svg */
export function CrosshairIcon(props: SourceIconProps) {
  return <SourceIcon src={startingPointSrc} {...props} />;
}

/** Ending point (destination). Source: src/components/ui/Icon/ending_point.svg */
export function PinIcon(props: SourceIconProps) {
  return <SourceIcon src={endingPointSrc} {...props} />;
}

/* ------------------------------------------------------------------------ *
 * Everything below is unchanged: hand-drawn line icons on the shared grid.
 * ------------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.35 4.9 5.15.7-3.75 3.7.92 5.2L12 16.05 7.33 18.5l.92-5.2L4.5 9.6l5.15-.7L12 4Z" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15.5V3.5" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M5.5 12.5v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6" />
    </Icon>
  );
}

export function AddToHomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="3" />
      <path d="M12 9v6M9 12h6" />
    </Icon>
  );
}
