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

/** Portrait size scale — box height in rem. */
export interface SizeStep {
  id: number;
  label: string;
  rem: number;
}

export const SIZES: SizeStep[] = [
  { id: 0, label: 'Small', rem: 2.4 },
  { id: 1, label: 'Medium', rem: 3.2 },
  { id: 2, label: 'Large', rem: 4.4 },
  { id: 3, label: 'Huge', rem: 6 },
];

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

/** Low-level courier URL builder. */
export function imageUrl(folder: string, tag: string, alticon?: string | null): string {
  const name = alticon ? `${tag}_${alticon}` : tag;
  return `${COURIER_BASE}/${folder}/${name}.png`;
}

export const heroImageUrl = (type: number, tag: string, alticon?: string | null): string =>
  imageUrl(portraitType(type).folder, tag, alticon);

export const itemImageUrl = (style: number, tag: string): string =>
  imageUrl(itemStyle(style).folder, tag);
