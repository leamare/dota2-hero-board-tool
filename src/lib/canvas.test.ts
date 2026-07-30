import { describe, expect, it } from 'vitest';
import { autoLayout, canvasBounds, elementRuns, fitPortraits, seedRects, toClassic } from './canvas';
import { emptyBoard } from './board';
import type { Board, CanvasRect, Category, GridElement } from '../types/board';

const hero = (n: number): GridElement[] =>
  Array.from({ length: n }, (_, i) => ({ kind: 'hero' as const, refId: i + 1 }));

const cat = (id: string, rect?: CanvasRect, elements: GridElement[] = hero(4)): Category => ({
  id,
  text: id,
  color: '',
  wideness: 0,
  elements,
  ...(rect ? { rect } : {}),
});

const boardWith = (categories: Category[], extra: Partial<Board> = {}): Board => ({
  ...emptyBoard('Canvas'),
  ...extra,
  categories,
});

/** do two rects overlap (with a hair of tolerance for float noise)? */
const overlaps = (a: CanvasRect, b: CanvasRect): boolean =>
  a.x < b.x + b.w - 0.01 &&
  b.x < a.x + a.w - 0.01 &&
  a.y < b.y + b.h - 0.01 &&
  b.y < a.y + a.h - 0.01;

describe('canvasBounds', () => {
  it('is at least the visible width and grows with content', () => {
    expect(canvasBounds([])).toEqual({ w: 100, h: 10 });
    const b = canvasBounds([cat('a', { x: 80, y: 40, w: 45, h: 30 })]);
    expect(b.w).toBe(125); // overflows to the right, canvas scrolls
    expect(b.h).toBe(70);
  });
});

describe('fitPortraits', () => {
  it('fills the box and never exceeds either dimension', () => {
    const h = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [6] });
    // 6 square portraits in 300x100: 6 across → 50px, limited by height 100
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThanOrEqual(100);
    const cols = Math.floor(300 / h);
    expect(cols * Math.ceil(6 / cols) >= 6).toBe(true);
  });

  it('grows when the box grows', () => {
    const small = fitPortraits({ boxW: 200, boxH: 80, aspect: 1, gap: 0, runs: [4] });
    const big = fitPortraits({ boxW: 400, boxH: 160, aspect: 1, gap: 0, runs: [4] });
    expect(big).toBeGreaterThan(small);
  });

  it('shrinks portraits when a row break forces extra rows', () => {
    const one = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [4] });
    const split = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [4, 4] });
    expect(split).toBeLessThan(one);
  });

  it('handles a degenerate box', () => {
    expect(fitPortraits({ boxW: 0, boxH: 0, aspect: 1, gap: 0, runs: [4] })).toBe(0);
    expect(fitPortraits({ boxW: 100, boxH: 100, aspect: 1, gap: 0, runs: [] })).toBe(0);
  });
});

describe('autoLayout', () => {
  it('removes overlaps and fills each row to exactly 100%', () => {
    // two boxes overlapping on the same band, one below
    const cats = [
      cat('a', { x: 0, y: 0, w: 60, h: 30 }),
      cat('b', { x: 40, y: 5, w: 60, h: 25 }),
      cat('c', { x: 0, y: 40, w: 50, h: 20 }),
    ];
    const out = autoLayout(cats);
    const rects = cats.map((c) => out.get(c.id)!);
    rects.forEach((r) => expect(r).toBeDefined());

    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++)
        expect(overlaps(rects[i], rects[j])).toBe(false);

    // a and b share the first band and together span the full width
    expect(rects[0].y).toBe(0);
    expect(rects[1].y).toBe(0);
    expect(rects[0].x + rects[0].w + rects[1].w).toBeCloseTo(100, 5);
    // the lone box on the second band fills the row
    expect(rects[2].w).toBeCloseTo(100, 5);
  });

  it('keeps left-to-right and top-to-bottom order', () => {
    const cats = [
      cat('right', { x: 60, y: 0, w: 40, h: 20 }),
      cat('left', { x: 0, y: 2, w: 40, h: 20 }),
      cat('below', { x: 0, y: 50, w: 40, h: 20 }),
    ];
    const out = autoLayout(cats);
    expect(out.get('left')!.x).toBeLessThan(out.get('right')!.x);
    expect(out.get('below')!.y).toBeGreaterThan(out.get('left')!.y);
  });

  it('stacks bands with no vertical gaps', () => {
    const cats = [
      cat('a', { x: 0, y: 0, w: 100, h: 20 }),
      cat('b', { x: 0, y: 70, w: 100, h: 15 }),
    ];
    const out = autoLayout(cats);
    expect(out.get('a')!.y).toBe(0);
    expect(out.get('b')!.y).toBe(20);
  });
});

describe('toClassic', () => {
  it('derives the column count from the most common row length', () => {
    const row = (y: number, n: number) =>
      Array.from({ length: n }, (_, i) =>
        cat(`r${y}c${i}`, { x: (100 / n) * i, y, w: 100 / n, h: 20 }),
      );
    const board = boardWith([...row(0, 3), ...row(20, 3), ...row(40, 2)]);
    expect(toClassic(board).columns).toBe(3);
  });

  it('orders categories in reading order and clears newRow', () => {
    const board = boardWith([
      cat('b', { x: 50, y: 0, w: 50, h: 20 }),
      cat('a', { x: 0, y: 0, w: 50, h: 20 }),
      cat('c', { x: 0, y: 30, w: 100, h: 20 }),
    ]);
    const { categories } = toClassic(board);
    expect(categories.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(categories.every((c) => !c.newRow)).toBe(true);
  });

  it('gives a full-width box a wider preset than a third-width one', () => {
    const board = boardWith([
      cat('full', { x: 0, y: 0, w: 100, h: 20 }),
      cat('third', { x: 0, y: 30, w: 33.3, h: 20 }),
      cat('t2', { x: 33.3, y: 30, w: 33.3, h: 20 }),
      cat('t3', { x: 66.6, y: 30, w: 33.4, h: 20 }),
    ]);
    const { categories } = toClassic(board);
    const byId = new Map(categories.map((c) => [c.id, c]));
    const basisOf = (id: string) => byId.get(id)!.wideness;
    expect(basisOf('full')).not.toBe(basisOf('third'));
  });

  it('keeps categories that have no rect', () => {
    const board = boardWith([cat('placed', { x: 0, y: 0, w: 100, h: 20 }), cat('loose')]);
    expect(toClassic(board).categories.map((c) => c.id)).toContain('loose');
  });
});

describe('seedRects', () => {
  it('lays a 3-column board into three columns of one band', () => {
    const board = boardWith([cat('a'), cat('b'), cat('c')], { columns: 3 });
    const seeded = seedRects(board);
    expect(seeded.size).toBe(3);
    const xs = ['a', 'b', 'c'].map((id) => seeded.get(id)!.x);
    expect(xs).toEqual([0, 100 / 3, (100 / 3) * 2]);
    // same row → same y and height
    const ys = ['a', 'b', 'c'].map((id) => seeded.get(id)!.y);
    expect(new Set(ys).size).toBe(1);
    ['a', 'b', 'c'].forEach((id) => expect(seeded.get(id)!.w).toBeCloseTo(100 / 3, 5));
  });

  it('stacks a second row below the first', () => {
    const board = boardWith([cat('a'), cat('b'), cat('c'), cat('d')], { columns: 3 });
    const seeded = seedRects(board);
    expect(seeded.get('d')!.y).toBeGreaterThan(seeded.get('a')!.y);
  });
});

describe('elementRuns', () => {
  it('splits on breaks and drops empty runs', () => {
    const c = cat('x', undefined, [
      ...hero(2),
      { kind: 'break' },
      ...hero(3),
      { kind: 'break' },
    ]);
    expect(elementRuns(c)).toEqual([2, 3]);
    expect(elementRuns(cat('y', undefined, hero(5)))).toEqual([5]);
  });
});
