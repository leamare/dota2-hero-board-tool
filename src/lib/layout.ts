import type { Board, Category } from '../types/board';
import { WIDENESS } from './constants';
import { resolveDisplay } from './board';

/** Padding + outline a category card adds around its portraits, in rem. */
const CARD_CHROME_REM = 0.9;
/** Fallback column width when the board hasn't been measured yet. */
const ASSUMED_COLUMN_REM = 16;

/** A category's resolved position on the 2D board grid. */
export interface Placement {
  id: string;
  /** 0-based grid row */
  row: number;
  /** 0-based grid column */
  col: number;
  /** number of columns the cell spans (the category's own width preset) */
  colSpan: number;
}

interface Cell {
  id: string;
  r: number;
  /** column offset, in layout units */
  c: number;
  /** width in layout units */
  w: number;
}

/**
 * Resolve the 2D placement of every category, honouring link chains:
 *  - a horizontal chain (`hGroup`) lays its members out in adjacent columns of
 *    one row; a vertical chain (`vGroup`) stacks them down one column; a
 *    category in both is the crossing point.
 *  - chains that don't fit the column count wrap like text.
 *  - categories are placed in reading order and never move backwards: a gap
 *    left in an earlier row stays a gap rather than swallowing whatever comes
 *    next. `newRow` starts a fresh row below everything placed so far.
 *
 * Order within a chain follows the order of `board.categories`.
 */
export function computeLayout(
  categories: Category[],
  columns: number,
  spanOf: (c: Category) => number = () => 1,
): Placement[] {
  const cols = Math.max(1, columns);
  const order = new Map(categories.map((c, i) => [c.id, i]));

  // ordered members of each chain (already in board order since we iterate so)
  const chains = (key: 'hGroup' | 'vGroup') => {
    const m = new Map<string, Category[]>();
    for (const c of categories) {
      const g = c[key];
      if (!g) continue;
      (m.get(g) ?? m.set(g, []).get(g)!).push(c);
    }
    return m;
  };
  const hChains = chains('hGroup');
  const vChains = chains('vGroup');

  // ---- connected components (categories joined by sharing a chain) ----
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) {
      const n = parent.get(x)!;
      parent.set(x, r);
      x = n;
    }
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  for (const c of categories) parent.set(c.id, c.id);
  for (const members of [...hChains.values(), ...vChains.values()])
    for (let i = 1; i < members.length; i++) union(members[0].id, members[i].id);

  const componentOf = new Map<string, Category[]>();
  for (const c of categories) {
    const root = find(c.id);
    (componentOf.get(root) ?? componentOf.set(root, []).get(root)!).push(c);
  }

  // ---- local (relative) coordinates for each component ----
  // returns the component's cells normalised so min row/col are 0
  const localCells = (members: Category[]): Cell[] => {
    const coord = new Map<string, { r: number; c: number }>();
    coord.set(members[0].id, { r: 0, c: 0 });

    // propagate along chains until stable
    let changed = true;
    while (changed) {
      changed = false;
      const spread = (chain: Category[], orient: 'h' | 'v') => {
        const known = chain.find((m) => coord.has(m.id));
        if (!known) return;
        const base = coord.get(known.id)!;
        const basePos = chain.indexOf(known);
        // horizontal neighbours sit after the widths of everything between
        const offsetTo = (p: number): number => {
          let sum = 0;
          if (p > basePos) for (let i = basePos; i < p; i++) sum += spanOf(chain[i]);
          else for (let i = p; i < basePos; i++) sum -= spanOf(chain[i]);
          return sum;
        };
        chain.forEach((m, p) => {
          if (coord.has(m.id)) return;
          const pos =
            orient === 'h'
              ? { r: base.r, c: base.c + offsetTo(p) }
              : { r: base.r + (p - basePos), c: base.c };
          coord.set(m.id, pos);
          changed = true;
        });
      };
      const seen = new Set<string>();
      for (const m of members) {
        if (m.hGroup && !seen.has('h' + m.hGroup)) {
          seen.add('h' + m.hGroup);
          spread(hChains.get(m.hGroup)!, 'h');
        }
        if (m.vGroup && !seen.has('v' + m.vGroup)) {
          seen.add('v' + m.vGroup);
          spread(vChains.get(m.vGroup)!, 'v');
        }
      }
    }

    let minR = Infinity;
    let minC = Infinity;
    for (const { r, c } of coord.values()) {
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
    }
    return members.map((m) => {
      const p = coord.get(m.id)!;
      return { id: m.id, r: p.r - minR, c: p.c - minC, w: spanOf(m) };
    });
  };

  // wrap a component's cells into `cols`-wide rows (reading order) when it is
  // wider than the board — chains overflow like text
  const wrap = (cells: Cell[]): Cell[] => {
    const ordered = [...cells].sort((a, b) => a.r - b.r || a.c - b.c);
    const out: Cell[] = [];
    let r = 0;
    let c = 0;
    for (const cell of ordered) {
      if (c + cell.w > cols) {
        r++;
        c = 0;
      }
      out.push({ ...cell, r, c });
      c += cell.w;
    }
    return out;
  };

  // ---- fill: place components/standalones into the occupancy grid ----
  const occ = new Set<string>();
  const taken = (r: number, c: number) => occ.has(`${r},${c}`);
  const take = (r: number, c: number) => occ.add(`${r},${c}`);

  const fits = (cells: Cell[], R: number, C: number): boolean =>
    cells.every(({ r, c, w }) => {
      if (C + c < 0 || C + c + w > cols) return false;
      for (let u = 0; u < w; u++) if (taken(R + r, C + c + u)) return false;
      return true;
    });
  const findSpot = (cells: Cell[], from = 0): { R: number; C: number } => {
    const width = Math.max(...cells.map((c) => c.c + c.w));
    for (let R = from; ; R++)
      for (let C = 0; C <= cols - width; C++) if (fits(cells, R, C)) return { R, C };
  };

  /*
   * Placement only ever moves forward. Without this a category would drop into
   * whatever hole an earlier row still had — so adding one full-width category
   * would send the next few back up to finish off the row above it.
   */
  let cursor = 0;
  let lastRow = -1;
  const nextFreeRow = () => lastRow + 1;

  const placements: Placement[] = [];
  const placed = new Set<string>();

  for (const c of categories) {
    if (placed.has(c.id)) continue;
    const isChained = !!(c.hGroup || c.vGroup);

    const from = c.newRow ? nextFreeRow() : cursor;

    if (!isChained) {
      const want = spanOf(c);
      // find the earliest free cell, then take either the requested width or —
      // for a "remaining space" category — everything left in that row
      const probe: Cell[] = [{ id: c.id, r: 0, c: 0, w: 1 }];
      const { R, C } = findSpot(want > 0 ? [{ ...probe[0], w: Math.min(cols, want) }] : probe, from);
      let span = want > 0 ? Math.min(cols, want) : 1;
      if (want <= 0) while (C + span < cols && !taken(R, C + span)) span++;
      for (let u = 0; u < span; u++) take(R, C + u);
      placements.push({ id: c.id, row: R, col: C, colSpan: span });
      placed.add(c.id);
      cursor = R;
      lastRow = Math.max(lastRow, R);
      continue;
    }

    // place the whole component this category belongs to
    const members = componentOf.get(find(c.id))!;
    let cells = localCells(members);
    const w = Math.max(...cells.map((x) => x.c + x.w));
    if (w > cols) cells = wrap(cells);
    const { R, C } = findSpot(cells, from);
    for (const cell of cells) {
      for (let u = 0; u < cell.w; u++) take(R + cell.r, C + cell.c + u);
      placements.push({ id: cell.id, row: R + cell.r, col: C + cell.c, colSpan: cell.w });
      placed.add(cell.id);
      lastRow = Math.max(lastRow, R + cell.r);
    }
    cursor = R;
  }

  // keep placements in board order for stable rendering
  placements.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return placements;
}

/** Which sides of a category touch a linked partner, for drawing connectors. */
export interface ChainSides {
  right?: boolean;
  down?: boolean;
}

/**
 * For each category, whether its immediate right / bottom neighbour is a member
 * of the same chain (so a connector can be drawn in the gap between them).
 */
export function chainLinks(
  categories: Category[],
  placements: Placement[],
): Map<string, ChainSides> {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const at = new Map(placements.map((p) => [`${p.row},${p.col}`, p]));
  const res = new Map<string, ChainSides>();
  for (const p of placements) {
    const c = byId.get(p.id);
    if (!c) continue;
    const right = at.get(`${p.row},${p.col + p.colSpan}`);
    const down = at.get(`${p.row + 1},${p.col}`);
    const sides: ChainSides = {};
    if (right && c.hGroup && byId.get(right.id)?.hGroup === c.hGroup) sides.right = true;
    if (down && c.vGroup && byId.get(down.id)?.vGroup === c.vGroup) sides.down = true;
    if (sides.right || sides.down) res.set(p.id, sides);
  }
  return res;
}

/**
 * Sub-columns per real column. The grid is laid out in these finer units so a
 * width preset means exactly what it says: a "Fourth" is 25% of the board even
 * when the column count isn't a multiple of four. 24 divides by 2, 3, 4, 6 and
 * 8, so every preset — down to an eighth — lands on a whole number of units.
 */
export const UNITS_PER_COLUMN = 24;

/** Signals "stretch to the end of the row" to the placement engine. */
export const FILL_SPAN = 0;

/**
 * How wide the board is rendered, so a category asking for "one portrait" can
 * be resolved into layout units. Optional — without it that preset falls back
 * to a sensible guess.
 */
export interface BoardMetrics {
  /** the board element's content width, in px */
  boardPx: number;
  /** gap between sub-columns, in px */
  gapPx: number;
  /** root font size, in px */
  rootPx: number;
}

/** Units needed to hold a box of `px` wide, given the measured board. */
function unitsForPx(px: number, total: number, m: BoardMetrics): number {
  // a span of n units covers n tracks plus the n-1 gaps between them
  const perUnit = (m.boardPx + m.gapPx) / total;
  return Math.min(total, Math.max(1, Math.ceil((px + m.gapPx) / perUnit)));
}

/** Width of a category in layout units, honouring its preset exactly. */
export function categoryUnits(category: Category, board: Board, metrics?: BoardMetrics): number {
  const total = board.columns * UNITS_PER_COLUMN;
  // no preset (or a chained member) = exactly one column
  if (!category.wideness) return UNITS_PER_COLUMN;
  const preset = WIDENESS[category.wideness];
  if (preset?.fill) return FILL_SPAN;

  if (preset?.portrait) {
    const { aspect, heightRem } = resolveDisplay(category, board);
    const rootPx = metrics?.rootPx ?? 16;
    // one portrait, plus the body padding either side and the card's outline
    const needed = heightRem * aspect * rootPx + CARD_CHROME_REM * rootPx;
    if (metrics) return unitsForPx(needed, total, metrics);
    // unmeasured (tests, first paint): assume columns of MIN_CATEGORY_REM
    const assumed = board.columns * ASSUMED_COLUMN_REM * rootPx;
    return Math.min(total, Math.max(1, Math.ceil((needed / assumed) * total)));
  }

  const basis = preset?.basis ?? 100 / board.columns;
  return Math.min(total, Math.max(1, Math.round((basis / 100) * total)));
}

/**
 * Convenience: layout using the board's wideness and a column count (defaults
 * to the board's own, but callers pass the fitted count so a narrow screen
 * uses fewer columns). Placements come back in sub-column units.
 */
export function boardLayout(
  board: Board,
  columns = board.columns,
  metrics?: BoardMetrics,
): Placement[] {
  return computeLayout(board.categories, columns * UNITS_PER_COLUMN, (c) => {
    const units = categoryUnits(c, board, metrics);
    // "remaining space" has no meaning inside a chain — the chain decides the
    // shape — so a chained member falls back to one column
    return units === FILL_SPAN && (c.hGroup || c.vGroup) ? UNITS_PER_COLUMN : units;
  });
}
