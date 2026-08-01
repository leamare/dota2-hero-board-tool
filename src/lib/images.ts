import { COURIER_BASE } from './config';

export type ElementKind = 'hero' | 'item' | 'empty' | 'custom' | 'break';

/**
 * Hero portrait *type* — the shape of the box. Size is a separate axis.
 * Index is the persisted id (append-only), used by the share encoder.
 */
export interface PortraitType {
  id: number;
  key: string;
  label: string;
  folder: string;
  /** width / height of the box this type renders into */
  aspect: number;
}

export const PORTRAIT_TYPES: PortraitType[] = [
  { id: 0, key: 'horizontal', label: 'Horizontal portraits', folder: 'portraits_lg', aspect: 256 / 144 },
  { id: 1, key: 'vertical', label: 'Vertical portraits', folder: 'portraits_vert_lg', aspect: 235 / 272 },
  { id: 2, key: 'icon', label: 'Mini icons', folder: 'icons', aspect: 1 },
];

/** Item image *source* — the box shape still comes from the category portrait type. */
export interface ItemStyle {
  id: number;
  key: string;
  label: string;
  folder: string;
}

export const ITEM_STYLES: ItemStyle[] = [
  { id: 0, key: 'items', label: 'Inventory', folder: 'items' },
  { id: 1, key: 'profile_badges', label: 'Profile Badges', folder: 'profile_badges' },
];

/**
 * Portrait size scale — box height in rem.
 *
 * A vertical portrait is *narrower* than it is tall, so at a shared height it
 * reads much smaller than a horizontal one. Each step therefore carries a
 * second height used by vertical portraits, one notch further up the scale.
 *
 * Ids are persisted (share codes, saved grids), so new steps are appended;
 * `SIZE_OPTIONS` holds the order menus show them in.
 */
export interface SizeStep {
  id: number;
  label: string;
  /** box height for horizontal portraits and icons */
  rem: number;
  /** box height for vertical portraits; falls back to `rem` */
  remVert?: number;
  /** stretch portraits to fill the row, using the height only as a minimum */
  auto?: boolean;
}

export const SIZES: SizeStep[] = [
  { id: 0, label: 'Small', rem: 2.4, remVert: 3.2 },
  { id: 1, label: 'Medium', rem: 3.2, remVert: 4.4 },
  { id: 2, label: 'Large', rem: 4.4, remVert: 6 },
  { id: 3, label: 'Huge', rem: 6, remVert: 8 },
  { id: 4, label: 'Massive', rem: 8, remVert: 11 },
  { id: 5, label: 'Absolute Unit', rem: 11, remVert: 14 },
  // packs in as many as fit and stretches them to use the whole width
  { id: 6, label: 'Autoscale', rem: 3.2, remVert: 4.4, auto: true },
  // smaller than Small — appended so existing grids keep their size ids
  { id: 7, label: 'Mini', rem: 1.7, remVert: 2.4 },
];

/** Menu order, smallest first, with the stretching option last. */
export const SIZE_OPTIONS: SizeStep[] = [
  SIZES[7],
  SIZES[0],
  SIZES[1],
  SIZES[2],
  SIZES[3],
  SIZES[4],
  SIZES[5],
  SIZES[6],
];

/** Does this size step stretch portraits to fill the category? */
export const isAutoSize = (id: number): boolean => !!SIZES[id]?.auto;

export const DEFAULT_PORTRAIT_TYPE = 0;
/** Vertical portraits — the default for grids imported from other formats. */
export const VERTICAL_PORTRAITS = 1;
export const DEFAULT_ITEM_STYLE = 0;
export const DEFAULT_SIZE = 0;

export const portraitType = (id: number): PortraitType =>
  PORTRAIT_TYPES[id] ?? PORTRAIT_TYPES[DEFAULT_PORTRAIT_TYPE];

export const itemStyle = (id: number): ItemStyle =>
  ITEM_STYLES[id] ?? ITEM_STYLES[DEFAULT_ITEM_STYLE];

export const sizeStep = (id: number): SizeStep => SIZES[id] ?? SIZES[DEFAULT_SIZE];

/** Box height in rem for a size step rendered at a given portrait type. */
export const sizeRem = (id: number, type: number): number => {
  const step = sizeStep(id);
  return type === VERTICAL_PORTRAITS ? (step.remVert ?? step.rem) : step.rem;
};

/** Low-level courier URL builder. */
export function imageUrl(folder: string, tag: string, alticon?: string | null): string {
  const name = alticon ? `${tag}_${alticon}` : tag;
  return `${COURIER_BASE}/${folder}/${name}.png`;
}

export const heroImageUrl = (type: number, tag: string, alticon?: string | null): string =>
  imageUrl(portraitType(type).folder, tag, alticon);

export const itemImageUrl = (style: number, tag: string): string =>
  imageUrl(itemStyle(style).folder, tag);
