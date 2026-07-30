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
      preset: 2,
      icon: { kind: 'facet', folder: 'facets', tag: 'mana' },
      color: 'green',
      wideness: 2,
      headerSize: 2,
      portraitType: 2,
      size: 1,
      vGroup: 'v0',
      hGroup: 'h0',
      elements: [
        { kind: 'hero', refId: 1 },
        { kind: 'hero', refId: 5, alticon: 'persona1' },
        { kind: 'item', refId: 116 },
        { kind: 'break' },
        { kind: 'empty' },
        { kind: 'custom', tag: 'seasonal_rank_1' },
      ],
    },
    {
      id: 'x2',
      text: 'Supports',
      icon: { kind: 'hero', refId: 8, alticon: 'alt', iconType: 2 },
      color: '',
      wideness: 0,
      headerSize: 1,
      vGroup: 'v0',
      hGroup: 'h0',
      elements: [],
    },
  ],
};

// drop ids and fill optional flag defaults so structural comparison is fair
const normalize = (b: Board) => ({
  ...b,
  categories: b.categories.map(({ id: _id, ...c }) => ({
    text: undefined,
    preset: undefined,
    icon: undefined,
    headerSize: 1,
    portraitType: undefined,
    itemStyle: undefined,
    size: undefined,
    hGroup: undefined,
    vGroup: undefined,
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

  it('round-trips an author', () => {
    const b = { ...sample, author: 'Leamare' };
    expect(decodeBoard(encodeBoard(b)).author).toBe('Leamare');
  });

  it('leaves the author unset when there is none', () => {
    expect(decodeBoard(encodeBoard(sample)).author).toBeUndefined();
  });

  it('round-trips a description', () => {
    const b = { ...sample, description: 'Draft helper for pos 1\nsecond line' };
    expect(decodeBoard(encodeBoard(b)).description).toBe('Draft helper for pos 1\nsecond line');
    expect(decodeBoard(encodeBoard(sample)).description).toBeUndefined();
  });
});
