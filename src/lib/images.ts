import { COURIER_BASE } from './config';

export type ElementKind = 'hero' | 'item';

export interface ImageStyle {
  /** stable id — equals the index in IMAGE_STYLES; used by the binary encoder */
  id: number;
  /** short machine key */
  key: string;
  /** courier folder the image lives in */
  folder: string;
  /** display label */
  label: string;
  /** which element kind this style renders */
  kind: ElementKind;
  /** width / height ratio, used as a layout hint */
  aspect: number;
}

/*
 * Append-only registry. The array index is the persisted id, so never reorder
 * or remove entries — only append. All folders verified against the courier CDN.
 */
export const IMAGE_STYLES: ImageStyle[] = [
  { id: 0, key: 'portraits_lg', folder: 'portraits_lg', label: 'Portrait (wide)', kind: 'hero', aspect: 256 / 144 },
  { id: 1, key: 'portraits_vert_lg', folder: 'portraits_vert_lg', label: 'Portrait (tall)', kind: 'hero', aspect: 235 / 272 },
  { id: 2, key: 'icons', folder: 'icons', label: 'Icon', kind: 'hero', aspect: 1 },
  { id: 3, key: 'items', folder: 'items', label: 'Item icon', kind: 'item', aspect: 88 / 64 },
  { id: 4, key: 'profile_badges', folder: 'profile_badges', label: 'Badge', kind: 'item', aspect: 1 },
  { id: 5, key: 'portraits', folder: 'portraits', label: 'Portrait (small)', kind: 'hero', aspect: 256 / 144 },
  { id: 6, key: 'portraits_vert', folder: 'portraits_vert', label: 'Portrait (small, tall)', kind: 'hero', aspect: 235 / 272 },
];

export const DEFAULT_HERO_STYLE = 0; // portraits_lg
export const DEFAULT_ITEM_STYLE = 3; // items

export const defaultStyleFor = (kind: ElementKind): number =>
  kind === 'item' ? DEFAULT_ITEM_STYLE : DEFAULT_HERO_STYLE;

export function getStyle(id: number): ImageStyle {
  return IMAGE_STYLES[id] ?? IMAGE_STYLES[DEFAULT_HERO_STYLE];
}

export const stylesForKind = (kind: ElementKind): ImageStyle[] =>
  IMAGE_STYLES.filter((s) => s.kind === kind);

/**
 * Build the courier image URL for a hero/item.
 * @param alticon optional alternate icon suffix (heroes only), e.g. "persona1"
 */
export function imageUrl(
  styleId: number,
  tag: string,
  alticon?: string | null,
): string {
  const style = getStyle(styleId);
  const name = alticon ? `${tag}_${alticon}` : tag;
  return `${COURIER_BASE}/${style.folder}/${name}.png`;
}
