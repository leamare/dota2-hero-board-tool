import type { Board, Category } from '../types/board';
import { WIDENESS } from './constants';

/** A category's resolved position on the 2D board grid. */
export interface Placement {
  id: string;
  /** 0-based grid row */
  row: number;
  /** 0-based grid column */
  col: number;
  /** number of columns the cell spans (wideness; chained members are always 1) */
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
 *  - standalone categories fill the remaining cells in reading order; cells
 *    with no filler stay blank.
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
  const findSpot = (cells: Cell[]): { R: number; C: number } => {
    const width = Math.max(...cells.map((c) => c.c + c.w));
    for (let R = 0; ; R++)
      for (let C = 0; C <= cols - width; C++) if (fits(cells, R, C)) return { R, C };
  };

  const placements: Placement[] = [];
  const placed = new Set<string>();

  for (const c of categories) {
    if (placed.has(c.id)) continue;
    const isChained = !!(c.hGroup || c.vGroup);

    if (!isChained) {
      // standalone: earliest row-major run of `span` free cells
      const span = Math.min(cols, Math.max(1, spanOf(c)));
      const cells: Cell[] = [{ id: c.id, r: 0, c: 0, w: span }];
      const { R, C } = findSpot(cells);
      for (let u = 0; u < span; u++) take(R, C + u);
      placements.push({ id: c.id, row: R, col: C, colSpan: span });
      placed.add(c.id);
      continue;
    }

    // place the whole component this category belongs to
    const members = componentOf.get(find(c.id))!;
    let cells = localCells(members);
    const w = Math.max(...cells.map((x) => x.c + x.w));
    if (w > cols) cells = wrap(cells);
    const { R, C } = findSpot(cells);
    for (const cell of cells) {
      for (let u = 0; u < cell.w; u++) take(R + cell.r, C + cell.c + u);
      placements.push({ id: cell.id, row: R + cell.r, col: C + cell.c, colSpan: cell.w });
      placed.add(cell.id);
    }
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
 * when the column count isn't a multiple of four. 12 divides by 2, 3, 4 and 6,
 * so every preset lands on a whole number of units.
 */
export const UNITS_PER_COLUMN = 12;

/** Width of a category in layout units, honouring its preset exactly. */
export function categoryUnits(category: Category, board: Board): number {
  const total = board.columns * UNITS_PER_COLUMN;
  // no preset (or a chained member) = exactly one column
  if (!category.wideness) return UNITS_PER_COLUMN;
  const basis = WIDENESS[category.wideness]?.basis ?? 100 / board.columns;
  return Math.min(total, Math.max(1, Math.round((basis / 100) * total)));
}

/**
 * Convenience: layout using the board's wideness and a column count (defaults
 * to the board's own, but callers pass the fitted count so a narrow screen
 * uses fewer columns). Placements come back in sub-column units.
 */
export function boardLayout(board: Board, columns = board.columns): Placement[] {
  return computeLayout(board.categories, columns * UNITS_PER_COLUMN, (c) =>
    c.hGroup || c.vGroup ? UNITS_PER_COLUMN : categoryUnits(c, board),
  );
}
