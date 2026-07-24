import { describe, expect, it } from 'vitest';
import { decodeBoard, encodeBoard } from './share';
import { emptyBoard } from './board';
import type { Board } from '../types/board';

const sample: Board = {
  name: 'Test Grid ✦',
  icon: '🔥',
  columns: 4,
  portraitType: 1,
  itemStyle: 0,
  size: 2,
  colorfulLabels: true,
  centered: false,
  darkenedBg: true,
  categories: [
    {
      id: 'x1',
      name: { type: 'preset', preset: 2 },
      color: 'green',
      wideness: 2,
      headerSize: 2,
      portraitType: 2,
      size: 1,
      linkGroup: 'g0',
      linkOrient: 'v',
      separatorAfter: true,
      elements: [
        { kind: 'hero', refId: 1 },
        { kind: 'hero', refId: 5, alticon: 'persona1' },
        { kind: 'item', refId: 116 },
        { kind: 'empty' },
        { kind: 'custom', tag: 'seasonal_rank_1' },
      ],
    },
    {
      id: 'x2',
      name: { type: 'hero', refId: 8, alticon: 'alt', iconType: 2 },
      color: '',
      wideness: 0,
      headerSize: 1,
      linkGroup: 'g0',
      linkOrient: 'v',
      separatorRight: true,
      elements: [],
    },
  ],
};

// drop ids and fill optional flag defaults so structural comparison is fair
const normalize = (b: Board) => ({
  ...b,
  categories: b.categories.map(({ id: _id, ...c }) => ({
    headerSize: 1,
    portraitType: undefined,
    itemStyle: undefined,
    size: undefined,
    linkGroup: undefined,
    linkOrient: undefined,
    separatorAfter: !!c.separatorAfter,
    separatorRight: !!c.separatorRight,
    newRow: !!c.newRow,
    ...c,
  })),
});

describe('board share encoding', () => {
  it('round-trips a populated board', () => {
    const decoded = decodeBoard(encodeBoard(sample));
    expect(normalize(decoded)).toEqual(normalize(sample));
  });

  it('round-trips an empty board', () => {
    const b = emptyBoard('Empty');
    expect(normalize(decodeBoard(encodeBoard(b)))).toEqual(normalize(b));
  });

  it('produces url-safe output', () => {
    expect(encodeBoard(sample)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects an unknown version', () => {
    expect(() => decodeBoard('AAAA')).toThrow();
  });
});
