import type { Board, Category } from '../types/board';
import { DEFAULT_HERO_STYLE, DEFAULT_ITEM_STYLE } from './images';

export const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function newCategory(): Category {
  return {
    id: genId(),
    name: { type: 'text', text: '' },
    color: '',
    wideness: 0,
    bigger: false,
    elements: [],
  };
}

export function emptyBoard(name = 'New Grid'): Board {
  return {
    name,
    columns: 3,
    heroStyle: DEFAULT_HERO_STYLE,
    itemStyle: DEFAULT_ITEM_STYLE,
    colorfulLabels: true,
    centered: false,
    darkenedBg: false,
    categories: [],
  };
}
