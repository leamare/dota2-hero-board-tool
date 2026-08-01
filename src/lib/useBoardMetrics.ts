import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { BoardMetrics } from './layout';

/**
 * Measure the rendered board so widths that are a real size rather than a
 * share of the row — "one portrait" — can be resolved into layout units.
 *
 * Returns a ref to put on the board element and the metrics, which are null
 * until the first measurement lands (the layout then falls back to an estimate
 * for that one paint).
 */
export function useBoardMetrics(): [RefObject<HTMLDivElement>, BoardMetrics | null] {
  const ref = useRef<HTMLDivElement>(null!);
  const [metrics, setMetrics] = useState<BoardMetrics | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const boardPx = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const gapPx = parseFloat(style.columnGap) || 0;
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      if (!boardPx) return;
      setMetrics((prev) =>
        prev && prev.boardPx === boardPx && prev.gapPx === gapPx && prev.rootPx === rootPx
          ? prev
          : { boardPx, gapPx, rootPx },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, metrics];
}
