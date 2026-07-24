import type { ElementKind } from '../lib/images';

/** A single box placed inside a category. */
export interface GridElement {
  kind: ElementKind;
  /** hero id or item id from metadata (hero/item kinds) */
  refId?: number;
  /** literal courier tag for custom icons not in metadata (custom kind) */
  tag?: string;
  /** alternate icon suffix for heroes, e.g. "persona1"; null = default */
  alticon?: string | null;
}

export type CategoryNameType = 'text' | 'preset' | 'hero' | 'item';

/** How a category header is labelled. */
export interface CategoryName {
  type: CategoryNameType;
  /** free text (type = text) */
  text?: string;
  /** preset label id (type = preset) */
  preset?: number;
  /** hero/item id shown as an icon (type = hero | item) */
  refId?: number;
  /** alternate icon for a hero/item name icon */
  alticon?: string | null;
  /** portrait type used to render a hero/item name icon */
  iconType?: number;
}

export interface Category {
  /** stable local id for react keys and drag-and-drop */
  id: string;
  name: CategoryName;
  /** label colour key ('' = none), see LABEL_COLORS */
  color: string;
  /** width preset index, see WIDENESS */
  wideness: number;
  /** header text/icon size step (0..2) */
  headerSize?: number;
  /** override the board's hero portrait type */
  portraitType?: number;
  /** override the board's item image style */
  itemStyle?: number;
  /** override the board's portrait size */
  size?: number;
  /** id shared by linked categories that always render together */
  linkGroup?: string;
  /** orientation of the link group this category belongs to */
  linkOrient?: 'v' | 'h';
  /** dashed separator (row break) after this category */
  separatorAfter?: boolean;
  /** vertical dashed separator overlaid on this category's right edge */
  separatorRight?: boolean;
  /** force this category to start on a new row */
  newRow?: boolean;
  elements: GridElement[];
}

export interface Board {
  name: string;
  /** small glyph shown for the grid in lists and the header */
  icon?: string;
  /** number of columns the categories flow into (1..6) */
  columns: number;
  /** default hero portrait type */
  portraitType: number;
  /** default item image style */
  itemStyle: number;
  /** default portrait size */
  size: number;
  /** colour category labels */
  colorfulLabels: boolean;
  /** center the whole board */
  centered: boolean;
  /** darken the page background */
  darkenedBg: boolean;
  categories: Category[];
}
