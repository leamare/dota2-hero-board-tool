import type { ElementKind } from '../lib/images';

/** A single portrait/icon placed inside a category. */
export interface GridElement {
  kind: ElementKind;
  /** hero id or item id from metadata */
  refId: number;
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
}

export interface Category {
  /** stable local id for react keys and drag-and-drop */
  id: string;
  name: CategoryName;
  /** label colour key ('' = none), see LABEL_COLORS */
  color: string;
  /** width preset index, see WIDENESS */
  wideness: number;
  /** render portraits larger */
  bigger: boolean;
  /** override the board's default hero image style */
  heroStyle?: number;
  /** override the board's default item image style */
  itemStyle?: number;
  /** draw a dashed separator after this category (also breaks the row) */
  separatorAfter?: boolean;
  /** force this category to start on a new row */
  newRow?: boolean;
  elements: GridElement[];
}

export interface Board {
  name: string;
  /** number of columns the categories flow into (1..6) */
  columns: number;
  /** default hero image style id */
  heroStyle: number;
  /** default item image style id */
  itemStyle: number;
  /** colour category labels */
  colorfulLabels: boolean;
  /** center the whole board */
  centered: boolean;
  /** darken the page background */
  darkenedBg: boolean;
  categories: Category[];
}
