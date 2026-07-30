import type { Board, Category, GridElement } from '../types/board';
import type { SavedLayout } from '../state/layoutsStore';
import { emptyBoard, genId } from './board';
import { LABEL_COLORS, WIDENESS } from './constants';
import { VERTICAL_PORTRAITS } from './images';

/**
 * Import support for grids made with the original AngularJS tool.
 *
 * Its layouts live in `localStorage.layouts` (and in exported .json files) as
 *   [{ name, tag, categories: [{ name, nameType, bigger, wide, mark, heroes }] }]
 * where `nameType` 0 = free text and 1 = a preset id, and `heroes` is a list of
 * Valve hero ids (0 meaning an empty slot). The preset ids, colour keys and
 * width steps are the same lists we still use, so those map across directly.
 */

interface LegacyCategory {
  name?: string | number;
  nameType?: number;
  bigger?: boolean;
  wide?: number | string;
  mark?: string;
  heroes?: unknown;
}

interface LegacyLayout {
  name?: string;
  tag?: string;
  categories?: LegacyCategory[];
}

/** Board-level options the old tool kept outside the layouts themselves. */
export interface LegacySettings {
  columns?: number;
  centered?: boolean;
  darkenedBg?: boolean;
  colorfulLabels?: boolean;
  bigger?: boolean;
}

const COLUMN_WORDS = ['one', 'two', 'three', 'four', 'five', 'six'];

/** Does this parsed JSON look like the old tool's layout list? */
export function isLegacyLayouts(parsed: unknown): boolean {
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length === 0) return false;
  return list.every((l) => {
    if (!l || typeof l !== 'object') return false;
    const cats = (l as LegacyLayout).categories;
    // new-format entries carry a `board`; legacy ones have categories with heroes
    if ('board' in (l as object)) return false;
    if (!Array.isArray(cats)) return false;
    return cats.every((c) => !!c && typeof c === 'object' && ('heroes' in c || 'nameType' in c));
  });
}

/** Read the old tool's global settings from localStorage, if present. */
export function readLegacySettings(): LegacySettings {
  const bool = (k: string): boolean | undefined => {
    const v = localStorage.getItem(k);
    return v === null ? undefined : v === 'true';
  };
  const word = localStorage.getItem('settingsColumns');
  const columns = word ? COLUMN_WORDS.indexOf(word) + 1 : 0;
  return {
    columns: columns > 0 ? columns : undefined,
    centered: bool('settingsCenteredView'),
    darkenedBg: bool('settingsDarkenedBg'),
    colorfulLabels: bool('settingsColorfulLabels'),
    bigger: bool('settingsForcedBig'),
  };
}

/** localStorage keys the old tool owned, cleared once its data is converted. */
export const LEGACY_KEYS = [
  'layouts',
  'settingsColumns',
  'settingsCenteredView',
  'settingsDarkenedBg',
  'settingsColorfulLabels',
  'settingsForcedBig',
  'settingsAutoSave',
  'settingsDarkTheme',
  'lastVersion',
];

const heroElements = (heroes: unknown): GridElement[] => {
  // stored either as an array of ids or as an id-keyed object
  const values = Array.isArray(heroes)
    ? heroes
    : heroes && typeof heroes === 'object'
      ? Object.values(heroes)
      : [];
  return values
    .map((v) => (typeof v === 'object' && v !== null ? (v as { value?: unknown }).value : v))
    .map((v) => Number(v))
    .filter((id) => Number.isFinite(id))
    .map<GridElement>((id) => (id > 0 ? { kind: 'hero', refId: id } : { kind: 'empty' }));
};

function convertCategory(c: LegacyCategory): Category {
  const wide = Number(c.wide ?? 0);
  const color = typeof c.mark === 'string' && LABEL_COLORS.some((l) => l.key === c.mark)
    ? c.mark
    : '';
  const cat: Category = {
    id: genId(),
    color,
    wideness: wide >= 0 && wide < WIDENESS.length ? wide : 0,
    elements: heroElements(c.heroes),
  };
  if (c.nameType === 1) cat.preset = Number(c.name) || 1;
  else cat.text = String(c.name ?? '');
  // the old "bigger" flag matches the Large size step
  if (c.bigger) cat.size = 2;
  return cat;
}

/** Convert the old tool's layout list into saved grids in the current format. */
export function convertLegacyLayouts(parsed: unknown, settings: LegacySettings = {}): SavedLayout[] {
  const list = (Array.isArray(parsed) ? parsed : [parsed]) as LegacyLayout[];
  return list.map((l, i) => {
    const board: Board = {
      ...emptyBoard(l.name?.trim() || `Imported grid ${i + 1}`),
      icon: l.tag || '',
      // the old format has no portrait style either — vertical reads best
      portraitType: VERTICAL_PORTRAITS,
      categories: (l.categories ?? []).map(convertCategory),
    };
    if (settings.columns) board.columns = settings.columns;
    if (settings.centered !== undefined) board.centered = settings.centered;
    if (settings.darkenedBg !== undefined) board.darkenedBg = settings.darkenedBg;
    if (settings.colorfulLabels !== undefined) board.colorfulLabels = settings.colorfulLabels;
    if (settings.bigger) board.size = 2;
    return { id: genId(), name: board.name, board };
  });
}
