import { describe, expect, it } from 'vitest';
import { autoLayout, canvasBounds, elementRuns, fitPortraits, seedRects, toClassic } from './canvas';
import { emptyBoard } from './board';
import { WIDENESS } from './constants';
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
  /** does everything actually fit, laid out the way flexbox would wrap it? */
  const fitsInside = (opts: {
    boxW: number;
    boxH: number;
    aspect: number;
    gap: number;
    runs: number[];
    breakPx?: number;
  }) => {
    const h = fitPortraits(opts);
    if (h === 0) return true;
    const { boxW, boxH, aspect, gap, runs, breakPx = 0 } = opts;
    const w = h * aspect;
    // flexbox packs as many as the width allows, then wraps
    const perRow = Math.max(1, Math.floor((boxW + gap) / (w + gap)));
    const rows = runs.filter((n) => n > 0).reduce((s, n) => s + Math.ceil(n / perRow), 0);
    const used = rows * h + (rows - 1) * gap + Math.max(0, runs.filter((n) => n > 0).length - 1) * breakPx;
    return used <= boxH + 0.01 && w <= boxW + 0.01;
  };

  it('never overflows, whatever the box and count', () => {
    const cases = [
      { boxW: 300, boxH: 100, aspect: 1, gap: 4, runs: [6] },
      { boxW: 300, boxH: 40, aspect: 16 / 9, runs: [24], gap: 3 }, // many in a short box
      { boxW: 90, boxH: 400, aspect: 16 / 9, runs: [30], gap: 3 }, // narrow and tall
      { boxW: 500, boxH: 120, aspect: 235 / 272, runs: [7, 5, 9], gap: 3, breakPx: 19 },
      { boxW: 120, boxH: 60, aspect: 1, gap: 2, runs: [1] },
      { boxW: 200, boxH: 55, aspect: 1, gap: 2, runs: [100] }, // absurd count → tiny portraits
    ];
    for (const c of cases) {
      expect(fitPortraits(c)).toBeGreaterThan(0);
      expect(fitsInside(c)).toBe(true);
    }
  });

  it('wraps onto more rows rather than overflowing the width', () => {
    // 12 wide portraits can't sit on one row in a 300px box
    const h = fitPortraits({ boxW: 300, boxH: 200, aspect: 16 / 9, gap: 0, runs: [12] });
    expect(h * (16 / 9)).toBeLessThanOrEqual(300);
    const perRow = Math.floor(300 / (h * (16 / 9)));
    expect(perRow).toBeLessThan(12);
    expect(Math.ceil(12 / perRow) * h).toBeLessThanOrEqual(200 + 0.01);
  });

  it('shrinks portraits as the count grows in a fixed box', () => {
    const few = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 2, runs: [4] });
    const many = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 2, runs: [40] });
    expect(many).toBeLessThan(few);
    expect(many).toBeGreaterThan(0);
  });

  it('grows when the box grows', () => {
    const small = fitPortraits({ boxW: 200, boxH: 80, aspect: 1, gap: 0, runs: [4] });
    const big = fitPortraits({ boxW: 400, boxH: 160, aspect: 1, gap: 0, runs: [4] });
    expect(big).toBeGreaterThan(small);
  });

  it('shrinks portraits when a row break forces extra rows', () => {
    const one = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [8] });
    const split = fitPortraits({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [4, 4] });
    expect(split).toBeLessThanOrEqual(one);
    expect(fitsInside({ boxW: 300, boxH: 100, aspect: 1, gap: 0, runs: [4, 4] })).toBe(true);
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

  it('round-trips a 6-column grid without inventing width presets', () => {
    // a 6-column board seeded into canvas and folded straight back should come
    // out as 6 plain columns, not "Fourth" everywhere
    const cats = Array.from({ length: 12 }, (_, i) => cat(`c${i}`, undefined, hero(3)));
    const board = boardWith(cats, { columns: 6 });
    const seeded = seedRects(board);
    const canvas = boardWith(
      cats.map((c) => ({ ...c, rect: seeded.get(c.id)! })),
      { columns: 6, canvas: true },
    );
    const { columns, categories } = toClassic(canvas);
    expect(columns).toBe(6);
    expect(categories.every((c) => c.wideness === 0)).toBe(true);
  });

  it('keeps a genuinely wide box wide', () => {
    const board = boardWith([
      cat('wide', { x: 0, y: 0, w: 50, h: 20 }),
      cat('a', { x: 50, y: 0, w: 25, h: 20 }),
      cat('b', { x: 75, y: 0, w: 25, h: 20 }),
      cat('c', { x: 0, y: 25, w: 25, h: 20 }),
      cat('d', { x: 25, y: 25, w: 25, h: 20 }),
      cat('e', { x: 50, y: 25, w: 25, h: 20 }),
      cat('f', { x: 75, y: 25, w: 25, h: 20 }),
    ]);
    const { columns, categories } = toClassic(board);
    const byId = new Map(categories.map((c) => [c.id, c]));
    expect(columns).toBe(4);
    expect(byId.get('wide')!.wideness).not.toBe(0); // spans two columns
    expect(byId.get('a')!.wideness).toBe(0);
  });

  it('reproduces the shape of a real in-game grid', () => {
    // "Leamare 728": a 1/3 + 2/3 row, a full-width row, three cores, two supports
    const board = boardWith([
      cat('best', { x: 0, y: 0, w: 33.3, h: 20 }),
      cat('practice', { x: 33.3, y: 0, w: 66.7, h: 20 }),
      cat('bans', { x: 0, y: 22, w: 100, h: 15 }),
      cat('safe', { x: 0, y: 40, w: 33.3, h: 18 }),
      cat('mid', { x: 33.3, y: 40, w: 33.3, h: 18 }),
      cat('off', { x: 66.6, y: 40, w: 33.4, h: 18 }),
      cat('pos4', { x: 0, y: 60, w: 50, h: 18 }),
      cat('pos5', { x: 50, y: 60, w: 50, h: 18 }),
    ]);
    const { columns, categories } = toClassic(board);
    const w = new Map(categories.map((c) => [c.id, c.wideness]));
    const basis = (id: string) => WIDENESS[w.get(id)!].basis;

    // the busiest row has three boxes
    expect(columns).toBe(3);
    // 1/3 + 2/3
    expect(w.get('best')).toBe(0); // one plain column
    expect(basis('practice')).toBeCloseTo(200 / 3, 1);
    // full width
    expect(basis('bans')).toBe(100);
    // three cores, each a plain column
    ['safe', 'mid', 'off'].forEach((id) => expect(w.get(id)).toBe(0));
    // two halves — not "two thirds", which is what column rounding used to give
    ['pos4', 'pos5'].forEach((id) => expect(basis(id)).toBe(50));
  });

  it('keeps a Third from decaying into Default and back', () => {
    const board = boardWith(
      [
        { ...cat('third', { x: 0, y: 0, w: 33.3, h: 20 }), wideness: 3 },
        cat('a', { x: 33.3, y: 0, w: 33.3, h: 20 }),
        cat('b', { x: 66.6, y: 0, w: 33.4, h: 20 }),
      ],
      { columns: 3 },
    );
    expect(toClassic(board).categories.find((c) => c.id === 'third')!.wideness).toBe(3);
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
    [0, 100 / 3, (100 / 3) * 2].forEach((want, i) => expect(xs[i]).toBeCloseTo(want, 5));
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
