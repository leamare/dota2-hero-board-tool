import { describe, expect, it } from 'vitest';
import { parseImport } from './importAny';
import { convertLegacyLayouts, isLegacyLayouts } from './legacyImport';
import { encodeBoard } from './share';
import { encodeLayouts } from './layoutsShare';
import { emptyBoard, genId } from './board';

// a layout list as written by the original AngularJS tool
const legacyJson = JSON.stringify([
  {
    name: 'Old Grid',
    tag: 'file',
    categories: [
      { name: 'My cores', nameType: 0, bigger: true, wide: 2, mark: 'red', heroes: [1, 5, 0] },
      { name: 6, nameType: 1, bigger: false, wide: 0, mark: '', heroes: [] },
    ],
  },
]);

describe('legacy conversion', () => {
  it('recognises the old format', () => {
    expect(isLegacyLayouts(JSON.parse(legacyJson))).toBe(true);
    expect(isLegacyLayouts([{ name: 'x', board: emptyBoard() }])).toBe(false);
  });

  it('maps names, presets, colours, widths, sizes and heroes', () => {
    const [layout] = convertLegacyLayouts(JSON.parse(legacyJson));
    expect(layout.name).toBe('Old Grid');
    expect(layout.board.icon).toBe('file');

    const [first, second] = layout.board.categories;
    expect(first.text).toBe('My cores');
    expect(first.preset).toBeUndefined();
    expect(first.color).toBe('red');
    expect(first.wideness).toBe(2);
    expect(first.size).toBe(2); // legacy "bigger"
    expect(first.elements).toEqual([
      { kind: 'hero', refId: 1 },
      { kind: 'hero', refId: 5 },
      { kind: 'empty' }, // hero id 0 was the old empty slot
    ]);

    expect(second.preset).toBe(6);
    expect(second.text).toBeUndefined();
    expect(second.size).toBeUndefined();
  });

  it('applies the old global settings to each converted board', () => {
    const [layout] = convertLegacyLayouts(JSON.parse(legacyJson), {
      columns: 4,
      centered: true,
      darkenedBg: false,
      colorfulLabels: false,
    });
    expect(layout.board.columns).toBe(4);
    expect(layout.board.centered).toBe(true);
    expect(layout.board.darkenedBg).toBe(false);
    expect(layout.board.colorfulLabels).toBe(false);
  });
});

describe('parseImport', () => {
  const board = { ...emptyBoard('Coded'), author: 'Leamare' };

  it('reads a bare board code', () => {
    const [l] = parseImport(encodeBoard(board));
    expect(l.board.name).toBe('Coded');
    expect(l.board.author).toBe('Leamare');
  });

  it('reads a share link', () => {
    const [l] = parseImport(`https://example.com/import?b=${encodeBoard(board)}`);
    expect(l.board.name).toBe('Coded');
  });

  it('reads an all-grids code and link', () => {
    const layouts = [{ id: genId(), name: 'A', board: emptyBoard('A') }];
    expect(parseImport(encodeLayouts(layouts))).toHaveLength(1);
    expect(parseImport(`https://example.com/layouts?l=${encodeLayouts(layouts)}`)).toHaveLength(1);
  });

  it('reads current JSON exports (list, single, bare board)', () => {
    const saved = { id: 'a', name: 'Saved', board: emptyBoard('Saved') };
    expect(parseImport(JSON.stringify([saved]))[0].name).toBe('Saved');
    expect(parseImport(JSON.stringify(saved))[0].name).toBe('Saved');
    expect(parseImport(JSON.stringify(emptyBoard('Bare')))[0].board.name).toBe('Bare');
  });

  it('reads legacy JSON', () => {
    const [l] = parseImport(legacyJson);
    expect(l.board.categories).toHaveLength(2);
  });

  it('rejects junk', () => {
    expect(() => parseImport('')).toThrow();
    expect(() => parseImport('not a grid at all')).toThrow();
    expect(() => parseImport('{"nope":1}')).toThrow();
  });
});

describe('game config shapes', () => {
  const config = (name: string) => ({
    config_name: name,
    categories: [
      {
        category_name: 'Cores',
        x_position: 0,
        y_position: 0,
        width: 400,
        height: 100,
        hero_ids: [1, 2, 3],
      },
    ],
  });

  it('imports the whole file', () => {
    const out = parseImport(JSON.stringify({ version: 3, configs: [config('A'), config('B')] }));
    expect(out.map((l) => l.name)).toEqual(['A', 'B']);
  });

  it('imports a bare configs array', () => {
    const out = parseImport(JSON.stringify([config('A'), config('B')]));
    expect(out.map((l) => l.name)).toEqual(['A', 'B']);
  });

  it('imports a single config object on its own', () => {
    const out = parseImport(JSON.stringify(config('Solo')));
    expect(out.map((l) => l.name)).toEqual(['Solo']);
    expect(out[0].board.canvas).toBe(true);
  });

  it('recovers a slice cut out of the configs array', () => {
    // objects in a row, with the array's trailing comma left behind — what you
    // get copying a couple of grids out of hero_grid_config.json
    const text = `${JSON.stringify(config('A'))},\n${JSON.stringify(config('B'))},`;
    const out = parseImport(text);
    expect(out.map((l) => l.name)).toEqual(['A', 'B']);
  });

  it('still rejects json that is simply broken', () => {
    expect(() => parseImport('{ "config_name": "x", ')).toThrow(/could not be parsed/);
  });
});
