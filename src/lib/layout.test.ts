import { describe, it, expect } from 'vitest';
import { UNITS_PER_COLUMN, boardLayout, computeLayout } from './layout';
import type { Board, Category } from '../types/board';

/** minimal category */
const cat = (id: string, extra: Partial<Category> = {}): Category => ({
  id,
  color: '',
  wideness: 0,
  elements: [],
  ...extra,
});

// The spec's cross: a vertical chain {Vt, M, Vb}, a horizontal chain {Hl, M, Hr}
// crossing at the mixed node M, plus four standalones. Base order is row-major.
const crossBoard = (): Category[] => [
  cat('Oa'),
  cat('Vt', { vGroup: 'v' }),
  cat('Ob'),
  cat('Hl', { hGroup: 'h' }),
  cat('M', { hGroup: 'h', vGroup: 'v' }),
  cat('Hr', { hGroup: 'h' }),
  cat('Oc'),
  cat('Vb', { vGroup: 'v' }),
  cat('Od'),
];

/** render placements into a grid of labels ('.' = blank) for easy assertions */
function grid(cats: Category[], columns: number): string[] {
  const p = computeLayout(cats, columns);
  const rows = Math.max(...p.map((x) => x.row)) + 1;
  const g: string[][] = Array.from({ length: rows }, () => Array(columns).fill('.'));
  for (const cell of p) g[cell.row][cell.col] = cell.id;
  return g.map((r) => r.join(' '));
}

describe('boardLayout in sub-column units', () => {
  const board = (cats: Category[], columns = 3): Board => ({
    name: 'b',
    columns,
    portraitType: 0,
    itemStyle: 0,
    size: 0,
    colorfulLabels: true,
    centered: false,
    darkenedBg: true,
    categories: cats,
  });

  it('gives a plain category exactly one column of units', () => {
    const p = boardLayout(board([cat('a'), cat('b'), cat('c')]));
    p.forEach((x) => expect(x.colSpan).toBe(UNITS_PER_COLUMN));
    expect(p.map((x) => x.col)).toEqual([0, 12, 24]);
  });

  it('honours a width preset exactly, not rounded to whole columns', () => {
    // "Fourth" is index 4 in WIDENESS (25%) — a quarter of 3*12 = 9 units
    const p = boardLayout(board([{ ...cat('q'), wideness: 4 }]));
    expect(p[0].colSpan).toBe(9);
  });

  it('gives chained members a full column each, not a single unit', () => {
    const a = { ...cat('a'), hGroup: 'h' };
    const b = { ...cat('b'), hGroup: 'h' };
    const p = boardLayout(board([a, b, cat('c')]));
    const byId = new Map(p.map((x) => [x.id, x]));
    expect(byId.get('a')!.colSpan).toBe(UNITS_PER_COLUMN);
    expect(byId.get('b')!.colSpan).toBe(UNITS_PER_COLUMN);
    // and they sit side by side, a full column apart
    expect(byId.get('b')!.col - byId.get('a')!.col).toBe(UNITS_PER_COLUMN);
  });

  it('stacks a vertical chain in one column', () => {
    const a = { ...cat('a'), vGroup: 'v' };
    const b = { ...cat('b'), vGroup: 'v' };
    const p = boardLayout(board([a, b]));
    const byId = new Map(p.map((x) => [x.id, x]));
    expect(byId.get('a')!.col).toBe(byId.get('b')!.col);
    expect(byId.get('b')!.row).toBe(byId.get('a')!.row + 1);
    expect(byId.get('b')!.colSpan).toBe(UNITS_PER_COLUMN);
  });

  it('never overlaps cards in the same row', () => {
    const cats = [{ ...cat('wide'), wideness: 2 }, cat('a'), cat('b'), cat('c')];
    const p = boardLayout(board(cats, 4));
    const rows = new Map<number, { col: number; colSpan: number }[]>();
    for (const x of p) (rows.get(x.row) ?? rows.set(x.row, []).get(x.row)!).push(x);
    for (const cells of rows.values()) {
      const sorted = [...cells].sort((m, n) => m.col - n.col);
      for (let i = 1; i < sorted.length; i++)
        expect(sorted[i].col).toBeGreaterThanOrEqual(sorted[i - 1].col + sorted[i - 1].colSpan);
    }
  });
});

describe('computeLayout', () => {
  it('places the cross with column-aligned chains and blanks at 4 columns', () => {
    expect(grid(crossBoard(), 4)).toEqual([
      'Oa Vt Ob Oc', // O V O O
      'Hl M Hr Od', //  H M H O
      '. Vb . .', //    _ V
    ]);
  });

  it('keeps chain members contiguous and ordered in a single column at 1 column', () => {
    const p = computeLayout(crossBoard(), 1);
    // everything in column 0
    expect(p.every((x) => x.col === 0)).toBe(true);
    // the chain reads V H M H V top-to-bottom, uninterrupted
    const byRow = [...p].sort((a, b) => a.row - b.row).map((x) => x.id);
    const chainRun = byRow.filter((id) => ['Vt', 'Hl', 'M', 'Hr', 'Vb'].includes(id));
    expect(chainRun).toEqual(['Vt', 'Hl', 'M', 'Hr', 'Vb']);
  });

  it('lays a lone horizontal chain across adjacent columns', () => {
    const cats = [cat('a', { hGroup: 'h' }), cat('b', { hGroup: 'h' }), cat('c', { hGroup: 'h' })];
    expect(grid(cats, 3)).toEqual(['a b c']);
  });

  it('stacks a lone vertical chain down one column', () => {
    const cats = [cat('a', { vGroup: 'v' }), cat('b', { vGroup: 'v' }), cat('c', { vGroup: 'v' })];
    expect(grid(cats, 3)).toEqual(['a . .', 'b . .', 'c . .']);
  });

  it('wraps a horizontal chain longer than the column count', () => {
    const cats = [cat('a', { hGroup: 'h' }), cat('b', { hGroup: 'h' }), cat('c', { hGroup: 'h' })];
    expect(grid(cats, 2)).toEqual(['a b', 'c .']);
  });
});
