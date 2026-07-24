import { describe, expect, it } from 'vitest';
import { decodeBoard, encodeBoard } from './share';
import { emptyBoard } from './board';
import type { Board } from '../types/board';

const sample: Board = {
  name: 'Test Grid ✦',
  columns: 4,
  heroStyle: 1,
  itemStyle: 3,
  colorfulLabels: true,
  centered: false,
  darkenedBg: true,
  categories: [
    {
      id: 'x1',
      name: { type: 'preset', preset: 2 },
      color: 'green',
      wideness: 2,
      bigger: true,
      separatorAfter: true,
      newRow: false,
      heroStyle: 2,
      elements: [
        { kind: 'hero', refId: 1 },
        { kind: 'hero', refId: 5, alticon: 'persona1' },
        { kind: 'item', refId: 116 },
      ],
    },
    {
      id: 'x2',
      name: { type: 'hero', refId: 8 },
      color: '',
      wideness: 0,
      bigger: false,
      elements: [],
    },
  ],
};

// drop ids and fill optional flag defaults so structural comparison is fair
const normalize = (b: Board) => ({
  ...b,
  categories: b.categories.map(({ id: _id, ...c }) => ({
    ...c,
    bigger: !!c.bigger,
    separatorAfter: !!c.separatorAfter,
    newRow: !!c.newRow,
    heroStyle: c.heroStyle,
    itemStyle: c.itemStyle,
  })),
});
const stripIds = normalize;

describe('board share encoding', () => {
  it('round-trips a populated board', () => {
    const decoded = decodeBoard(encodeBoard(sample));
    expect(stripIds(decoded)).toEqual(stripIds(sample));
  });

  it('round-trips an empty board', () => {
    const b = emptyBoard('Empty');
    const decoded = decodeBoard(encodeBoard(b));
    expect(stripIds(decoded)).toEqual(stripIds(b));
  });

  it('produces url-safe output', () => {
    const s = encodeBoard(sample);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects an unknown version', () => {
    expect(() => decodeBoard('AAAA')).toThrow();
  });
});
