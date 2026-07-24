import type { Board, Category, GridElement } from '../types/board';
import { DEFAULT_HERO_STYLE, DEFAULT_ITEM_STYLE } from './images';
import { WIDENESS } from './constants';

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

/** Image style id to use for an element, honouring category then board defaults. */
export function effectiveStyle(
  element: GridElement,
  category: Category,
  board: Board,
): number {
  if (element.kind === 'item') return category.itemStyle ?? board.itemStyle;
  return category.heroStyle ?? board.heroStyle;
}

/** Width (flex-basis %) a category occupies given its wideness and the column count. */
export function categoryBasis(category: Category, board: Board): number {
  if (category.wideness === 0) return 100 / board.columns;
  return WIDENESS[category.wideness]?.basis ?? 100 / board.columns;
}
