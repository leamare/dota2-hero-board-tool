import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Board, CanvasRect, Category } from '../../types/board';
import { canvasBounds, cardInnerBox, categoryAspect, elementRuns, fitPortraits } from '../../lib/canvas';
import CategoryCard from './CategoryCard';

interface Props {
  board: Board;
  /** render a card yourself (edit mode adds drag handles and controls) */
  renderCard?: (ctx: {
    category: Category;
    rect: CanvasRect;
    style: CSSProperties;
    portraitPx: number;
  }) => ReactNode;
  /** width to lay out against instead of measuring (used by the image export) */
  width?: number;
  /** reports px-per-percent whenever the canvas is measured */
  onMeasure?: (unit: number) => void;
  children?: ReactNode;
}

/** Rect for a category that has never been placed, so nothing disappears. */
const FALLBACK: CanvasRect = { x: 0, y: 0, w: 100 / 3, h: 20 };

/**
 * Free-placement board. Rects are percentages of the canvas *width*, so the
 * whole layout scales with the container and keeps its proportions; the canvas
 * grows (and scrolls) when content sits past the right or bottom edge.
 */
export default function CanvasBoard({ board, renderCard, width, onMeasure, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(width ?? 0);

  // track the container width, the unit every rect is expressed in
  useLayoutEffect(() => {
    if (width !== undefined) {
      setMeasured(width);
      onMeasure?.(width / 100);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const read = () => {
      setMeasured(el.clientWidth);
      onMeasure?.(el.clientWidth / 100);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const bounds = canvasBounds(board.categories);
  const unit = measured / 100; // px per percent
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const pxHeight = bounds.h * unit;

  return (
    <div
      ref={ref}
      className={[
        'board',
        'canvas-board',
        board.darkenedBg ? 'darken' : '',
        board.colorfulLabels ? 'full-labels' : '',
        board.clearHeaders ? 'clear-heads' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: pxHeight || undefined }}
    >
      {/* content layer can be wider than the viewport; the board scrolls */}
      <div className="canvas-content" style={{ width: bounds.w * unit, height: pxHeight }}>
        {measured > 0 &&
          board.categories.map((category) => {
            const rect = category.rect ?? FALLBACK;
            const style: CSSProperties = {
              left: rect.x * unit,
              top: rect.y * unit,
              width: rect.w * unit,
              height: rect.h * unit,
            };

            // portraits always shrink to fit the box — wrapping onto as many
            // rows as needed — so a card never overflows whatever its size
            const inner = cardInnerBox(category, rect.w * unit, rect.h * unit, rootPx);
            const portraitPx = fitPortraits({
              ...inner,
              aspect: categoryAspect(category, board),
              runs: elementRuns(category),
            });

            if (renderCard) return renderCard({ category, rect, style, portraitPx });
            return (
              <CategoryCard
                key={category.id}
                category={category}
                board={board}
                style={{ ...style, position: 'absolute' }}
                portraitPx={portraitPx}
              />
            );
          })}
        {children}
      </div>
    </div>
  );
}
