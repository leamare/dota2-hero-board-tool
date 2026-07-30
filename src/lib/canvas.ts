import type { Board, CanvasRect, Category } from '../types/board';
import { SIZES, portraitType } from './images';
import { WIDENESS } from './constants';
import { boardLayout } from './layout';
import { resolveDisplay } from './board';

/**
 * Canvas-mode geometry. Every rect value is a percentage of the canvas *width*,
 * including `y` and `h`, so the whole layout keeps its proportions at any window
 * size. Values may exceed 100 — the canvas scrolls.
 *
 * Everything here is pure so it can be unit tested and reused by the renderer,
 * the auto-layout button and the canvas → classic conversion.
 */

/** Smallest box a category may be dragged down to, in percent of canvas width. */
export const MIN_RECT_W = 6;
export const MIN_RECT_H = 4;

/** Grid the drag/resize snaps to while Alt is held, in percent of canvas width. */
export const SNAP_PCT = 1;

export const snap = (v: number, step = SNAP_PCT): number => Math.round(v / step) * step;

/** Content extent of a canvas, never smaller than the visible 100% width. */
export function canvasBounds(categories: Category[]): { w: number; h: number } {
  let w = 100;
  let h = 0;
  for (const c of categories) {
    if (!c.rect) continue;
    w = Math.max(w, c.rect.x + c.rect.w);
    h = Math.max(h, c.rect.y + c.rect.h);
  }
  return { w, h: Math.max(h, 10) };
}

/**
 * Turn the current classic layout into canvas rects, so switching into canvas
 * mode doesn't move anything. Cell widths come from the grid columns; heights
 * are estimated from what each card actually needs at that width.
 */
export function seedRects(board: Board): Map<string, CanvasRect> {
  const cols = Math.max(1, board.columns);
  const placements = boardLayout(board, cols);
  const colW = 100 / cols;
  const byId = new Map(board.categories.map((c) => [c.id, c]));
  const out = new Map<string, CanvasRect>();

  // height of one row = the tallest card placed in it
  const rowHeights = new Map<number, number>();
  const cardHeight = (cat: Category, widthPct: number): number => {
    const { aspect, heightRem } = resolveDisplay(cat, board);
    // rough but stable: portraits are heightRem tall, and rem ≈ 1% of a 1200px
    // canvas, so express the card in the same percent-of-width units
    const remPct = 100 / 75;
    const portraitH = heightRem * remPct;
    const portraitW = portraitH * aspect;
    const inner = widthPct - 1;
    const perRow = Math.max(1, Math.floor(inner / Math.max(0.1, portraitW)));
    const rows = Math.max(1, Math.ceil(cat.elements.length / perRow));
    const headerH = 2.6;
    return headerH + rows * portraitH + 1.2;
  };

  for (const p of placements) {
    const cat = byId.get(p.id);
    if (!cat) continue;
    const h = cardHeight(cat, colW * p.colSpan);
    rowHeights.set(p.row, Math.max(rowHeights.get(p.row) ?? 0, h));
  }

  // stack rows top to bottom
  const rowTop = new Map<number, number>();
  let y = 0;
  for (const row of [...rowHeights.keys()].sort((a, b) => a - b)) {
    rowTop.set(row, y);
    y += rowHeights.get(row)!;
  }

  for (const p of placements) {
    out.set(p.id, {
      x: p.col * colW,
      y: rowTop.get(p.row) ?? 0,
      w: colW * p.colSpan,
      h: rowHeights.get(p.row) ?? 10,
    });
  }
  return out;
}

/**
 * Largest portrait height (px) that fits `count` boxes of the given aspect into
 * an inner box, trying every column count and keeping the best. `runs` are the
 * element counts between row breaks; the tightest run wins so a break never
 * overflows.
 */
export function fitPortraits(opts: {
  boxW: number;
  boxH: number;
  aspect: number;
  gap: number;
  runs: number[];
}): number {
  const { boxW, boxH, aspect, gap, runs } = opts;
  const counts = runs.filter((n) => n > 0);
  if (counts.length === 0 || boxW <= 0 || boxH <= 0) return 0;

  // a break forces its own row, so the runs share the height between them
  const totalRowsMin = counts.length;
  let best = Infinity;

  for (const n of counts) {
    const share = (boxH - gap * (totalRowsMin - 1)) / totalRowsMin;
    let bestForRun = 0;
    for (let c = 1; c <= n; c++) {
      const rows = Math.ceil(n / c);
      const byHeight = (share - gap * (rows - 1)) / rows;
      const byWidth = (boxW - gap * (c - 1)) / (c * aspect);
      const h = Math.min(byHeight, byWidth);
      if (h > bestForRun) bestForRun = h;
    }
    best = Math.min(best, bestForRun);
  }
  return Math.max(0, best === Infinity ? 0 : best);
}

interface Band {
  members: Category[];
  top: number;
  height: number;
}

/** Group categories into horizontal bands by their vertical overlap. */
function bandCategories(categories: Category[]): Band[] {
  const placed = categories.filter((c) => c.rect);
  if (placed.length === 0) return [];
  const sorted = [...placed].sort((a, b) => a.rect!.y - b.rect!.y || a.rect!.x - b.rect!.x);

  const bands: Band[] = [];
  for (const cat of sorted) {
    const r = cat.rect!;
    const current = bands[bands.length - 1];
    // a box joins the band when it starts above the band's vertical midpoint
    const midpoint = current ? current.top + current.height / 2 : Infinity;
    if (current && r.y < midpoint) {
      current.members.push(cat);
      current.height = Math.max(current.height, r.y + r.h - current.top);
    } else {
      bands.push({ members: [cat], top: r.y, height: r.h });
    }
  }
  for (const b of bands) b.members.sort((x, y) => x.rect!.x - y.rect!.x);
  return bands;
}

/**
 * Tidy a canvas: keep the arrangement the user built, but remove overlaps and
 * fill the width. Bands become rows; each member keeps its share of the width.
 */
export function autoLayout(categories: Category[]): Map<string, CanvasRect> {
  const bands = bandCategories(categories);
  const out = new Map<string, CanvasRect>();
  let y = 0;

  for (const band of bands) {
    const total = band.members.reduce((s, c) => s + c.rect!.w, 0) || 1;
    let x = 0;
    const height = Math.max(...band.members.map((c) => c.rect!.h));
    band.members.forEach((cat, i) => {
      // last member absorbs the rounding so the row ends exactly at 100
      const w = i === band.members.length - 1 ? 100 - x : (cat.rect!.w / total) * 100;
      out.set(cat.id, { x, y, w, h: height });
      x += w;
    });
    y += height;
  }
  return out;
}

/** Index of the entry in `values` closest to `target`. */
const nearestIndex = (values: number[], target: number): number =>
  values.reduce((best, v, i) => (Math.abs(v - target) < Math.abs(values[best] - target) ? i : best), 0);

/**
 * Fold a canvas arrangement back into classic grid settings: reading order,
 * a column count, per-category width presets and portrait sizes.
 *
 * Inherently approximate — a freeform canvas has no exact grid equivalent — so
 * this aims to be predictable: bands become rows, and proportions snap to the
 * nearest existing preset.
 */
export function toClassic(board: Board): {
  columns: number;
  categories: Category[];
} {
  const bands = bandCategories(board.categories);
  const unplaced = board.categories.filter((c) => !c.rect);

  // the most common band length is the column count that fits best
  const counts = new Map<number, number>();
  for (const b of bands) counts.set(b.members.length, (counts.get(b.members.length) ?? 0) + 1);
  let columns = 3;
  let bestSeen = -1;
  for (const [len, times] of counts) {
    if (times > bestSeen || (times === bestSeen && len > columns)) {
      columns = len;
      bestSeen = times;
    }
  }
  columns = Math.min(6, Math.max(1, columns));

  const colW = 100 / columns;
  const widthValues = WIDENESS.map((w) => w.basis);
  const sizeValues = SIZES.map((s) => s.rem);

  const ordered: Category[] = [];
  for (const band of bands) {
    const height = Math.max(...band.members.map((c) => c.rect!.h));
    for (const cat of band.members) {
      const r = cat.rect!;
      // width preset closest to the share of the row this box occupies
      const spanCols = Math.max(1, Math.round(r.w / colW));
      const wideness = nearestIndex(widthValues, Math.min(100, spanCols * colW));

      // portrait size closest to what auto-fit was giving it, in rem-ish units
      const { aspect } = resolveDisplay(cat, board);
      const runs = elementRuns(cat);
      const fitted = fitPortraits({
        boxW: r.w - 1,
        boxH: height - 3.5,
        aspect,
        gap: 0.2,
        runs,
      });
      const remPct = 100 / 75;
      const size = nearestIndex(sizeValues, fitted / remPct);

      ordered.push({ ...cat, wideness, size, newRow: false });
    }
  }
  return { columns, categories: [...ordered, ...unplaced] };
}

/** Element counts between row breaks (a category with no breaks is one run). */
export function elementRuns(category: Category): number[] {
  const runs: number[] = [];
  let n = 0;
  for (const el of category.elements) {
    if (el.kind === 'break') {
      runs.push(n);
      n = 0;
    } else n++;
  }
  runs.push(n);
  return runs.filter((c) => c > 0);
}

/** Aspect used for a category's portraits (canvas cards need it too). */
export const categoryAspect = (category: Category, board: Board): number =>
  portraitType(category.portraitType ?? board.portraitType).aspect;
