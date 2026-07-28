import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout';
import type { Category } from '../types/board';

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
