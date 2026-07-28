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

export type CategoryIconKind = 'hero' | 'item' | 'facet' | 'custom';

/** An optional icon shown in a category header, independent of its text label. */
export interface CategoryIcon {
  kind: CategoryIconKind;
  /** hero/item id (kind = hero | item) */
  refId?: number;
  /** courier folder (kind = facet | custom) */
  folder?: string;
  /** courier tag (kind = facet | custom) */
  tag?: string;
  /** portrait type used to render a hero/item icon */
  iconType?: number;
  /** alternate icon for a hero icon */
  alticon?: string | null;
}

export interface Category {
  /** stable local id for react keys and drag-and-drop */
  id: string;
  /** free-text label (used when preset is unset) */
  text?: string;
  /** preset label id (overrides text when set) */
  preset?: number;
  /** optional icon shown alongside the text label */
  icon?: CategoryIcon;
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
  /** id of the horizontal chain this category belongs to (adjacent columns) */
  hGroup?: string;
  /** id of the vertical chain this category belongs to (stacked rows) */
  vGroup?: string;
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
