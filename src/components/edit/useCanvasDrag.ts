import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CanvasRect } from '../../types/board';
import { MIN_RECT_H, MIN_RECT_W, snap } from '../../lib/canvas';

/** Which edges a drag is moving; empty string means move the whole box. */
export type Handle = '' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export const HANDLES: Exclude<Handle, ''>[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];

interface Options {
  /** px per percent — the canvas width divided by 100 */
  unit: number;
  onChange: (id: string, rect: CanvasRect) => void;
}

interface DragState {
  id: string;
  handle: Handle;
  startX: number;
  startY: number;
  origin: CanvasRect;
}

/**
 * Free move and resize for canvas cards, driven by raw pointer events.
 *
 * dnd-kit is built for sortable lists; this is 2D placement plus eight resize
 * handles, so plain pointer capture is both simpler and more precise.
 *
 * Dragging is unconstrained (matching the Dota 2 client) — hold **Alt** to snap
 * to a 1%-of-width grid. Boxes may extend past 100% width, since the canvas
 * scrolls, but never to negative coordinates.
 */
export function useCanvasDrag({ unit, onChange }: Options) {
  const drag = useRef<DragState | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onPointerDown = useCallback(
    (id: string, rect: CanvasRect, handle: Handle) => (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      drag.current = {
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origin: { ...rect },
      };
      setActiveId(id);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      if (!d || unit <= 0) return;
      const dx = (e.clientX - d.startX) / unit;
      const dy = (e.clientY - d.startY) / unit;
      const fine = !e.altKey; // Alt snaps; plain dragging is free
      const q = (v: number) => (fine ? v : snap(v));

      const o = d.origin;
      let { x, y, w, h } = o;

      if (d.handle === '') {
        x = q(o.x + dx);
        y = q(o.y + dy);
      } else {
        if (d.handle.includes('w')) {
          const right = o.x + o.w;
          x = Math.min(q(o.x + dx), right - MIN_RECT_W);
          w = right - x;
        }
        if (d.handle.includes('e')) w = Math.max(MIN_RECT_W, q(o.w + dx));
        if (d.handle.includes('n')) {
          const bottom = o.y + o.h;
          y = Math.min(q(o.y + dy), bottom - MIN_RECT_H);
          h = bottom - y;
        }
        if (d.handle.includes('s')) h = Math.max(MIN_RECT_H, q(o.h + dy));
      }

      onChange(d.id, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: Math.max(MIN_RECT_W, w),
        h: Math.max(MIN_RECT_H, h),
      });
    },
    [unit, onChange],
  );

  const endDrag = useCallback(() => {
    drag.current = null;
    setActiveId(null);
  }, []);

  return { onPointerDown, onPointerMove, endDrag, activeId, dragging: activeId !== null };
}
