import { describe, expect, it } from 'vitest';
import {
  BREAK_CATEGORY_NAME,
  GAME_CANVAS_UNITS,
  fromGameGrid,
  importStamp,
  isGameGrid,
  setTagResolver,
  toGameGrid,
} from './gameGrid';
import { parseImport } from './importAny';
import { emptyBoard } from './board';
import type { GameGridFile } from './gameGrid';

// shaped exactly like the file the game writes
const gameFile: GameGridFile = {
  version: 3,
  configs: [
    {
      config_name: 'Leamare 740',
      categories: [
        {
          category_name: 'Best heroes',
          x_position: 0,
          y_position: 0,
          width: 456.521759,
          height: 138.91304,
          hero_ids: [67, 92, 119, 113, 58],
        },
        {
          category_name: 'Safelane Core',
          x_position: 600,
          y_position: 255.652176,
          width: 393.260864,
          height: 208.043488,
          hero_ids: [6, 36, 70],
        },
      ],
    },
  ],
};

describe('game hero_grid_config', () => {
  it('recognises the format and rejects others', () => {
    expect(isGameGrid(gameFile)).toBe(true);
    expect(isGameGrid([{ name: 'x', board: emptyBoard() }])).toBe(false);
    expect(isGameGrid({ version: 3 })).toBe(false);
  });

  it('imports every config as a canvas grid, scaled to percent of width', () => {
    const [layout] = fromGameGrid(gameFile);
    expect(layout.name).toBe('Leamare 740');
    expect(layout.board.canvas).toBe(true);

    const [first, second] = layout.board.categories;
    expect(first.text).toBe('Best heroes');
    expect(first.rect!.x).toBe(0);
    expect(first.rect!.y).toBe(0);
    expect(first.rect!.w).toBeCloseTo((456.521759 / GAME_CANVAS_UNITS) * 100, 6);
    expect(first.rect!.h).toBeCloseTo((138.91304 / GAME_CANVAS_UNITS) * 100, 6);
    // 600 of 1200 units is the middle of the canvas
    expect(second.rect!.x).toBeCloseTo(50, 6);
    expect(first.elements).toEqual([67, 92, 119, 113, 58].map((refId) => ({ kind: 'hero', refId })));
  });

  it('round-trips positions back to game units', () => {
    const layouts = fromGameGrid(gameFile);
    const back = toGameGrid(layouts);
    expect(back.version).toBe(3);
    expect(back.configs[0].config_name).toBe('Leamare 740');
    const [a, b] = back.configs[0].categories;
    expect(a.width).toBeCloseTo(456.521759, 4);
    expect(a.hero_ids).toEqual([67, 92, 119, 113, 58]);
    expect(b.x_position).toBeCloseTo(600, 4);
  });

  it('drops items and blanks, and writes an icon label as {S:name}', () => {
    const board = {
      ...emptyBoard('Mixed'),
      canvas: true,
      categories: [
        {
          id: 'a',
          icon: { kind: 'hero' as const, refId: 5 },
          color: '',
          wideness: 0,
          rect: { x: 0, y: 0, w: 50, h: 20 },
          elements: [
            { kind: 'hero' as const, refId: 1 },
            { kind: 'item' as const, refId: 116 },
            { kind: 'empty' as const },
            { kind: 'break' as const },
            { kind: 'hero' as const, refId: 2 },
          ],
        },
      ],
    };
    const out = toGameGrid([{ id: 'l', name: 'Mixed', board }], {
      heroTag: (id) => (id === 5 ? 'crystal_maiden' : `h${id}`),
    });
    const cats = out.configs[0].categories;
    expect(cats[0].category_name).toBe('{S:crystal_maiden}');
    // the item and the blank are gone; the break starts a second block
    expect(cats[0].hero_ids).toEqual([1]);
    expect(cats[1].category_name).toBe(BREAK_CATEGORY_NAME);
    expect(cats[1].hero_ids).toEqual([2]);
  });

  it('gives a classic grid positions on the way out', () => {
    const board = {
      ...emptyBoard('Classic'),
      columns: 3,
      categories: ['a', 'b', 'c'].map((id) => ({
        id,
        text: id,
        color: '',
        wideness: 0,
        elements: [{ kind: 'hero' as const, refId: 1 }],
      })),
    };
    const out = toGameGrid([{ id: 'l', name: 'Classic', board }]);
    const xs = out.configs[0].categories.map((c) => c.x_position);
    expect(xs[0]).toBeCloseTo(0, 4);
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
    out.configs[0].categories.forEach((c) => expect(c.width).toBeGreaterThan(0));
  });

  it('makes duplicate grid names unique, since the game keys grids by name', () => {
    const grid = (name: string) => ({
      id: name + Math.random(),
      name,
      board: { ...emptyBoard(name), canvas: true, categories: [] },
    });
    const out = toGameGrid([grid('Draft'), grid('Draft'), grid('Other'), grid('Draft')]);
    expect(out.configs.map((c) => c.config_name)).toEqual([
      'Draft',
      'Draft (2)',
      'Other',
      'Draft (3)',
    ]);
  });

  it('splits a category on a row break into stacked blocks', () => {
    const board = {
      ...emptyBoard('Breaks'),
      canvas: true,
      categories: [
        {
          id: 'a',
          text: 'Cores',
          color: '',
          wideness: 0,
          rect: { x: 10, y: 20, w: 40, h: 30 },
          elements: [
            { kind: 'hero' as const, refId: 1 },
            { kind: 'hero' as const, refId: 2 },
            { kind: 'break' as const },
            { kind: 'hero' as const, refId: 3 },
            { kind: 'hero' as const, refId: 4 },
          ],
        },
      ],
    };
    const cats = toGameGrid([{ id: 'l', name: 'Breaks', board }]).configs[0].categories;
    expect(cats).toHaveLength(2);

    const [first, second] = cats;
    expect(first.category_name).toBe('Cores');
    expect(first.hero_ids).toEqual([1, 2]);
    expect(second.category_name).toBe(BREAK_CATEGORY_NAME);
    expect(second.hero_ids).toEqual([3, 4]);

    // stacked inside the original box: same column, second below the first
    expect(second.x_position).toBe(first.x_position);
    expect(second.width).toBe(first.width);
    expect(second.y_position).toBeCloseTo(first.y_position + first.height, 4);
    // and together they still cover exactly the original height
    expect(first.height + second.height).toBeCloseTo(30 / (100 / GAME_CANVAS_UNITS), 3);
  });

  it('leaves a category without breaks as a single block', () => {
    const board = {
      ...emptyBoard('Plain'),
      canvas: true,
      categories: [
        {
          id: 'a',
          text: 'Cores',
          color: '',
          wideness: 0,
          rect: { x: 0, y: 0, w: 50, h: 20 },
          elements: [{ kind: 'hero' as const, refId: 1 }],
        },
      ],
    };
    expect(toGameGrid([{ id: 'l', name: 'Plain', board }]).configs[0].categories).toHaveLength(1);
  });

  it('round-trips an icon label and a row break back into a single category', () => {
    setTagResolver((tag) => (tag === 'spectre' ? { kind: 'hero', refId: 67 } : null));
    const file: GameGridFile = {
      version: 3,
      configs: [
        {
          config_name: 'Icons',
          categories: [
            {
              category_name: '{S:spectre}',
              x_position: 0,
              y_position: 0,
              width: 600,
              height: 120,
              hero_ids: [1, 2],
            },
            {
              category_name: BREAK_CATEGORY_NAME,
              x_position: 0,
              y_position: 120,
              width: 600,
              height: 120,
              hero_ids: [3],
            },
          ],
        },
      ],
    };
    const [layout] = fromGameGrid(file);
    // the two boxes came back as one card with a break in the middle
    expect(layout.board.categories).toHaveLength(1);
    const cat = layout.board.categories[0];
    expect(cat.icon).toEqual({ kind: 'hero', refId: 67 });
    expect(cat.text).toBeUndefined();
    expect(cat.elements.map((e) => e.kind)).toEqual(['hero', 'hero', 'break', 'hero']);
    // and it covers both boxes
    expect(cat.rect!.h).toBeCloseTo((240 / GAME_CANVAS_UNITS) * 100, 5);
    setTagResolver(null);
  });

  it('writes a category icon as {S:tag}', () => {
    const board = {
      ...emptyBoard('Icons'),
      canvas: true,
      categories: [
        {
          id: 'a',
          icon: { kind: 'hero' as const, refId: 67 },
          color: '',
          wideness: 0,
          rect: { x: 0, y: 0, w: 50, h: 20 },
          elements: [{ kind: 'hero' as const, refId: 1 }],
        },
      ],
    };
    const out = toGameGrid([{ id: 'l', name: 'Icons', board }], { heroTag: () => 'spectre' });
    expect(out.configs[0].categories[0].category_name).toBe('{S:spectre}');
  });

  it('keeps an unresolvable icon marker as text rather than losing it', () => {
    setTagResolver(null);
    const file: GameGridFile = {
      version: 3,
      configs: [
        {
          config_name: 'X',
          categories: [
            { category_name: '{S:mystery}', x_position: 0, y_position: 0, width: 100, height: 50, hero_ids: [] },
          ],
        },
      ],
    };
    expect(fromGameGrid(file)[0].board.categories[0].text).toBe('{S:mystery}');
  });

  it('is picked up by the unified importer', () => {
    const layouts = parseImport(JSON.stringify(gameFile));
    expect(layouts).toHaveLength(1);
    expect(layouts[0].board.canvas).toBe(true);
  });

  it('stamps imports with a sortable timestamp', () => {
    expect(importStamp(new Date(2026, 6, 28, 9, 5))).toBe('2026-07-28 09:05');
  });
});
