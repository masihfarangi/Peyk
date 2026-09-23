import type { SVGProps } from 'react';

/**
 * The app mark: same drawing as the boot splash in index.html. Kept in sync
 * there by hand, since the splash paints before React mounts and can't
 * import this component — but every other screen that needs the Peyk logo
 * (the registration header, for one) uses this.
 */
export function LogoMark({
  size = 56,
  ...rest
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#CB2027"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <circle cx="13" cy="33" r="8" />
      <circle cx="35" cy="33" r="8" />
      <path d="M13 33 L20.5 19 L30 19 L35 33" />
      <rect x="17.5" y="10.5" width="9" height="9" rx="1.5" />
      <path d="M22 10.5 L22 19.5" />
    </svg>
  );
}
