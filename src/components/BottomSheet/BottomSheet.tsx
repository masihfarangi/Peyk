import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  children: ReactNode;
  /** Accessible name for the sheet region. */
  label: string;
  /** How much of the sheet stays visible when collapsed, in CSS pixels. */
  peekHeight?: number;
  /** Reports the currently visible height so the map can pad its fit. */
  onVisibleHeightChange?: (height: number) => void;
}

type Snap = 'full' | 'peek';

/**
 * Bottom sheet with a real drag, built on pointer events rather than a
 * gesture library — it is about eighty lines and keeps the bundle small.
 *
 * It snaps between two positions: fully open, and a peek that leaves the first
 * transport option and the map both visible. It never drags away entirely,
 * because the options are the point of the screen.
 */
export function BottomSheet({
  open,
  children,
  label,
  peekHeight = 190,
  onVisibleHeightChange,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [snap, setSnap] = useState<Snap>('full');
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const drag = useRef<{ startY: number; startOffset: number; pointerId: number } | null>(null);

  /** How far down the sheet sits when collapsed. */
  const maxOffset = Math.max(0, contentHeight - peekHeight);

  // Measure content so the snap maths uses real pixels, not guesses.
  useLayoutEffect(() => {
    const element = sheetRef.current;
    if (!element) return;

    const measure = () => setContentHeight(element.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  // A newly opened sheet, or new content, always starts fully visible.
  useEffect(() => {
    if (open) {
      setSnap('full');
      setOffset(0);
    }
  }, [open]);

  const currentOffset = open ? offset : contentHeight;

  useEffect(() => {
    onVisibleHeightChange?.(open ? Math.max(0, contentHeight - offset) : 0);
  }, [contentHeight, offset, onVisibleHeightChange, open]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (maxOffset <= 0) return;
      drag.current = { startY: event.clientY, startOffset: offset, pointerId: event.pointerId };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [maxOffset, offset],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      if (!state || state.pointerId !== event.pointerId) return;

      const delta = event.clientY - state.startY;
      // Clamped rather than rubber-banded: the sheet has hard limits, and
      // letting it overshoot would expose a gap under it.
      const next = Math.min(maxOffset, Math.max(0, state.startOffset + delta));
      setOffset(next);
    },
    [maxOffset],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      if (!state) return;
      drag.current = null;
      setDragging(false);

      // Snap to whichever end is nearer.
      const shouldCollapse = offset > maxOffset / 2;
      setSnap(shouldCollapse ? 'peek' : 'full');
      setOffset(shouldCollapse ? maxOffset : 0);

      if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      }
    },
    [maxOffset, offset],
  );

  const toggle = useCallback(() => {
    const next: Snap = snap === 'full' ? 'peek' : 'full';
    setSnap(next);
    setOffset(next === 'peek' ? maxOffset : 0);
  }, [maxOffset, snap]);

  return (
    <div
      ref={sheetRef}
      role="region"
      aria-label={label}
      aria-hidden={!open}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-[600] rounded-t-sheet border-t border-line bg-paper shadow-sheet"
      style={{
        transform: `translate3d(0, ${currentOffset}px, 0)`,
        transition: dragging ? 'none' : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        paddingBottom: 'calc(20px + var(--peyk-safe-bottom))',
        visibility: open || currentOffset < contentHeight ? 'visible' : 'hidden',
        touchAction: 'none',
      }}
    >
      {/* The grab area: the handle plus the padding around it. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={toggle}
          className="mx-auto flex h-8 w-full items-center justify-center"
          aria-label={snap === 'full' ? 'Collapse the sheet' : 'Expand the sheet'}
          aria-expanded={snap === 'full'}
        >
          <span className="h-1 w-10 rounded-full bg-line" />
        </button>
      </div>

      <div className="px-5 pt-1">{children}</div>
    </div>
  );
}
