import type { Board, CanvasRect, Category } from '../types/board';
import { SIZES, portraitType } from './images';
import { WIDENESS } from './constants';
import { UNITS_PER_COLUMN, boardLayout } from './layout';
import { resolveDisplay } from './board';

/**
 * Canvas-mode geometry. Every rect value is a percentage of the canvas *width*,
 * including `y` and `h`, so the whole layout keeps its proportions at any window
 * size. Values may exceed 100 — the canvas scrolls.
 *
 * Everything here is pure so it can be unit tested and reused by the renderer,
 * the auto-layout button and the canvas → classic conversion.
 */

/** What to do with the grid's structure when entering canvas mode. */
export interface ToCanvasOptions {
  /** lay chained categories out together (default on) */
  respectChains?: boolean;
  /** drop the chain links once seeded, so leaving canvas won't re-chain (default on) */
  eraseChains?: boolean;
}

/** What to derive from the canvas when going back to a classic grid. */
export interface ToClassicOptions {
  /** set each category's portrait size from how big its portraits ended up */
  adjustSizes?: boolean;
  /** re-create chains from boxes that ended up adjacent */
  deduceChains?: boolean;
}

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
export function seedRects(board: Board, opts: ToCanvasOptions = {}): Map<string, CanvasRect> {
  const cols = Math.max(1, board.columns);
  // ignoring chains lays every category out in plain reading order instead
  const source = opts.respectChains === false
    ? { ...board, categories: board.categories.map((c) => ({ ...c, hGroup: undefined, vGroup: undefined })) }
    : board;
  const placements = boardLayout(source, cols);
  // placements come back in sub-column units, so a rect is a share of the total
  const unitW = 100 / (cols * UNITS_PER_COLUMN);
  const colW = unitW;
  const byId = new Map(source.categories.map((c) => [c.id, c]));
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
 * Largest portrait height (px) at which *every* element still fits inside the
 * box — wrapping onto as many rows as it takes, and shrinking as far as it has
 * to. Never overflows.
 *
 * For each candidate number of portraits per row, the width constraint fixes a
 * height, the wrapping fixes how many rows all the runs need together (a row
 * break starts a new run), and the height constraint fixes another height. The
 * smaller of the two fits; the best candidate wins.
 *
 * `runs` are the element counts between row breaks, and `breakPx` is the
 * vertical space each divider itself occupies.
 */
export function fitPortraits(opts: {
  boxW: number;
  boxH: number;
  aspect: number;
  gap: number;
  runs: number[];
  breakPx?: number;
}): number {
  const { boxW, boxH, aspect, gap, runs, breakPx = 0 } = opts;
  const counts = runs.filter((n) => n > 0);
  if (counts.length === 0 || boxW <= 0 || boxH <= 0) return 0;

  // dividers eat height before any portrait gets a share of it
  const dividers = Math.max(0, counts.length - 1) * breakPx;
  const usableH = boxH - dividers;
  if (usableH <= 0) return 0;

  const most = Math.max(...counts);
  let best = 0;

  for (let perRow = 1; perRow <= most; perRow++) {
    const byWidth = (boxW - gap * (perRow - 1)) / (perRow * aspect);
    if (byWidth <= 0) continue;
    // every run wraps independently, so add up the rows they all need
    const rows = counts.reduce((sum, n) => sum + Math.ceil(n / perRow), 0);
    const byHeight = (usableH - gap * (rows - 1)) / rows;
    const h = Math.min(byWidth, byHeight);
    if (h > best) best = h;
  }
  return Math.max(0, best);
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
export function toClassic(
  board: Board,
  opts: ToClassicOptions = {},
): { columns: number; categories: Category[] } {
  const bands = bandCategories(board.categories);
  const unplaced = board.categories.filter((c) => !c.rect);

  // the busiest row decides the column count, so every row can be expressed:
  // a grid of 2 + 1 + 3 + 2 boxes per row needs 3 columns.
  const widest = bands.reduce((most, b) => Math.max(most, b.members.length), 1);
  const columns = Math.min(6, Math.max(1, widest));

  const colW = 100 / columns;
  const widthValues = WIDENESS.map((w) => w.basis);
  const sizeValues = SIZES.map((s) => s.rem);

  const ordered: Category[] = [];
  for (const band of bands) {
    const height = Math.max(...band.members.map((c) => c.rect!.h));
    for (const cat of band.members) {
      const r = cat.rect!;
      // Match the width the box actually occupies against the presets directly.
      // Rounding to whole columns first would turn a half-width box in a
      // 3-column grid into "Two thirds"; the grid is laid out in sub-columns
      // now, so a preset means exactly its percentage.
      const currentBasis = cat.wideness ? widthValues[cat.wideness] : colW;
      const wideness = Math.abs(currentBasis - r.w) < 1.5
        ? // the preset it already had still describes this box — keep it
          cat.wideness
        : (() => {
            const preset = nearestIndex(widthValues, Math.min(100, r.w));
            // Lean towards "Default" — a plain column that keeps following the
            // grid's column count. Hand-drawn rows are never exactly even, and
            // three roughly-equal boxes should come out as three columns rather
            // than picking up stray presets, so another preset only wins when
            // it is closer by a clear margin.
            const defaultMiss = Math.abs(colW - r.w);
            const presetMiss = Math.abs(widthValues[preset] - r.w);
            return defaultMiss - presetMiss > colW / 4 ? preset : 0;
          })();

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

      ordered.push({
        ...cat,
        wideness,
        // portrait sizes are only touched when asked for — otherwise the
        // category keeps whatever it had before the canvas detour
        // without the option the canvas detour shouldn't leave per-category
        // sizes behind — everything falls back to the grid's own setting
        size: opts.adjustSizes ? size : undefined,
        newRow: false,
      });
    }
  }
  const all = [...ordered, ...unplaced];
  return { columns, categories: opts.deduceChains ? deduceChains(all, bands) : all };
}

/**
 * Re-create chains from a tidied canvas: boxes sitting side by side in a band
 * with matching heights read as a horizontal chain, and boxes in the same
 * column across consecutive bands as a vertical one. Best effort — the canvas
 * has no explicit link information left to recover.
 */
function deduceChains(categories: Category[], bands: Band[]): Category[] {
  const hOf = new Map<string, string>();
  const vOf = new Map<string, string>();

  bands.forEach((band, bi) => {
    // neighbours that touch and are the same height belong together
    let run: Category[] = [];
    const flush = () => {
      if (run.length > 1) run.forEach((m) => hOf.set(m.id, `h${bi}-${run[0].id}`));
      run = [];
    };
    for (const cat of band.members) {
      const prev = run[run.length - 1];
      const touching =
        prev && Math.abs(prev.rect!.x + prev.rect!.w - cat.rect!.x) < 1.5 &&
        Math.abs(prev.rect!.h - cat.rect!.h) < 1.5;
      if (prev && !touching) flush();
      run.push(cat);
    }
    flush();
  });

  // a box directly under one of the same width and column continues a chain
  for (let i = 1; i < bands.length; i++) {
    for (const cat of bands[i].members) {
      const above = bands[i - 1].members.find(
        (m) => Math.abs(m.rect!.x - cat.rect!.x) < 1.5 && Math.abs(m.rect!.w - cat.rect!.w) < 1.5,
      );
      if (!above) continue;
      const group = vOf.get(above.id) ?? `v${above.id}`;
      vOf.set(above.id, group);
      vOf.set(cat.id, group);
    }
  }

  return categories.map((c) => ({
    ...c,
    hGroup: hOf.get(c.id),
    vGroup: vOf.get(c.id),
  }));
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

/* Card chrome, in rem, mirroring board.css so the fit knows the real space:
   header min-heights per size step, body padding and the gap between boxes. */
const HEADER_REM = [1.5, 2, 3, 4];
const BODY_PAD_REM = 0.35;
const GAP_REM = 0.2;
const BREAK_REM = 1.2; // 0.2 border + 0.5 margin top and bottom

/** Space available to portraits inside a card of the given px size. */
export function cardInnerBox(
  category: Category,
  boxW: number,
  boxH: number,
  rootPx: number,
): { boxW: number; boxH: number; gap: number; breakPx: number } {
  const header = HEADER_REM[category.headerSize ?? 1] ?? 2;
  // a couple of px of slack absorbs sub-pixel rounding of the rem paddings and
  // borders, so the last row is never clipped by the body's overflow
  const SLACK = 2;
  return {
    boxW: boxW - BODY_PAD_REM * 2 * rootPx - SLACK,
    boxH: boxH - (header + BODY_PAD_REM * 2) * rootPx - SLACK,
    gap: GAP_REM * rootPx,
    breakPx: BREAK_REM * rootPx,
  };
}
