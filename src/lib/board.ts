import type { Board, Category, GridElement } from '../types/board';
import {
  DEFAULT_ITEM_STYLE,
  DEFAULT_PORTRAIT_TYPE,
  DEFAULT_SIZE,
  heroImageUrl,
  imageUrl,
  itemImageUrl,
  itemStyle,
  portraitType,
  sizeStep,
} from './images';
import { WIDENESS } from './constants';

export const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function newCategory(): Category {
  return {
    id: genId(),
    text: '',
    color: '',
    wideness: 0,
    elements: [],
  };
}

/** Resolve a category's textual label (preset overrides free text). */
export function categoryText(category: Category, presetLabel: (v: number) => string): string {
  if (category.preset !== undefined) return presetLabel(category.preset);
  return category.text ?? '';
}

export function emptyBoard(name = 'New Grid'): Board {
  return {
    name,
    icon: '',
    columns: 3,
    portraitType: DEFAULT_PORTRAIT_TYPE,
    itemStyle: DEFAULT_ITEM_STYLE,
    size: DEFAULT_SIZE,
    colorfulLabels: true,
    centered: false,
    darkenedBg: true,
    categories: [],
  };
}

/** Resolve a category's effective display settings, honouring overrides. */
export function resolveDisplay(category: Category, board: Board) {
  const type = category.portraitType ?? board.portraitType;
  return {
    type,
    style: category.itemStyle ?? board.itemStyle,
    size: category.size ?? board.size,
    aspect: portraitType(type).aspect,
    heightRem: sizeStep(category.size ?? board.size).rem,
  };
}

/** Image URL for an element inside a category (heroes, items, custom tags). */
export function elementImageUrl(
  element: GridElement,
  category: Category,
  board: Board,
  meta: { heroById: Map<number, { tag: string }>; itemById: Map<number, { tag: string }> },
): string | null {
  const { type, style } = resolveDisplay(category, board);
  switch (element.kind) {
    case 'hero': {
      const tag = element.refId != null ? meta.heroById.get(element.refId)?.tag : undefined;
      return tag ? heroImageUrl(type, tag, element.alticon) : null;
    }
    case 'item': {
      const tag = element.refId != null ? meta.itemById.get(element.refId)?.tag : undefined;
      return tag ? itemImageUrl(style, tag) : null;
    }
    case 'custom':
      return element.tag ? imageUrl(itemStyle(style).folder, element.tag) : null;
    case 'empty':
    default:
      return null;
  }
}

/** Width (flex-basis %) a category occupies given its wideness and the column count. */
export function categoryBasis(category: Category, board: Board): number {
  if (category.wideness === 0) return 100 / board.columns;
  return WIDENESS[category.wideness]?.basis ?? 100 / board.columns;
}

/** How many grid columns a category (or group) spans, given the board width. */
export function categorySpan(category: Category, board: Board): number {
  const basis = categoryBasis(category, board);
  return Math.min(board.columns, Math.max(1, Math.round((basis / 100) * board.columns)));
}

export interface RenderUnit {
  categories: Category[];
  /** 'v' stacked, 'h' side-by-side, null for a lone category */
  orient: 'v' | 'h' | null;
  key: string;
}

/**
 * Collapse linked categories into render units. Linked categories (sharing a
 * linkGroup) are gathered at the position of their first member and always
 * render together, stacked ('v') or side-by-side ('h').
 */
export function groupCategories(categories: Category[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  const done = new Set<string>();
  for (const c of categories) {
    if (done.has(c.id)) continue;
    if (c.linkGroup) {
      const members = categories.filter((x) => x.linkGroup === c.linkGroup);
      members.forEach((m) => done.add(m.id));
      units.push({ categories: members, orient: c.linkOrient ?? 'v', key: c.linkGroup });
    } else {
      units.push({ categories: [c], orient: null, key: c.id });
    }
  }
  return units;
}

/** Grid column span for a render unit. */
export function unitSpan(unit: RenderUnit, board: Board): number {
  if (unit.orient === 'h') {
    const total = unit.categories.reduce((s, c) => s + categorySpan(c, board), 0);
    return Math.min(board.columns, Math.max(1, total));
  }
  return categorySpan(unit.categories[0], board);
}
