import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-paper border-brand active:bg-brandActive',
  secondary: 'bg-paper text-ink border-line active:bg-mist',
  quiet: 'bg-transparent text-slate border-transparent active:text-ink',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Full-width primary action, as used at the bottom of the sheet. */
  block?: boolean;
  children: ReactNode;
}

/**
 * Every tappable control in the app. Minimum height is 48px: comfortable for a
 * thumb, and above the 44px touch-target floor on both platforms.
 */
export function Button({
  variant = 'primary',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex min-h-touch items-center justify-center gap-2 rounded-pill border px-5',
        'text-body font-semibold tracking-[-0.01em]',
        'transition-[transform,background-color] duration-150 ease-spring',
        'motion-safe:active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
