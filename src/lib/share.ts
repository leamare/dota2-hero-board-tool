import type { Board, Category, CategoryIcon, GridElement } from '../types/board';
import { emptyBoard, genId } from './board';
import {
  ByteReader,
  ByteWriter,
  fromBase64Url,
  packBytes,
  toBase64Url,
  unpackBytes,
} from './bytes';
import type { CategoryIconKind } from '../types/board';
import type { ElementKind } from './images';

const SHARE_VERSION = 8;
/** Older versions this decoder still understands. */
const LEGACY_VERSIONS = [5, 6, 7];

const KIND_CODE: Record<Exclude<ElementKind, 'break'>, number> = {
  hero: 0,
  item: 1,
  empty: 2,
  custom: 3,
};
const KIND_BY_CODE: ElementKind[] = ['hero', 'item', 'empty', 'custom'];
const ICON_KIND_CODE: Record<CategoryIconKind, number> = { hero: 0, item: 1, facet: 2, custom: 3 };
const ICON_KIND_BY_CODE: CategoryIconKind[] = ['hero', 'item', 'facet', 'custom'];

// board flag bits
const B_COLORFUL = 1;
const B_CENTERED = 2;
const B_DARKENED = 4;

// icon flag bits
const I_ALTICON = 1;
const I_ICON_TYPE = 2;

// category flag bits
const C_PRESET = 1;
const C_ICON = 2;
const C_LINK = 4; // v5 only: single link group (+orient byte)
const C_VGROUP = 4; // v6: vertical chain index (reuses bit 4)
const C_NEWROW = 8;
const C_PORTRAIT = 16;
const C_ITEMSTYLE = 32;
const C_SIZE = 64;
const C_HGROUP = 128; // v6: horizontal chain index

// element flag bits (kind in low 2 bits)
const E_KIND_MASK = 3;
const E_ALTICON = 4;
const E_BREAK = 8; // a row break; payload-less like empty, its own kind on decode

// colour keys in the same fixed order as LABEL_COLORS (see constants.ts).
const COLOR_KEYS = [
  '', 'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
  'violet', 'purple', 'pink', 'brown', 'grey', 'black',
];
const colorIndexOf = (key: string): number => Math.max(0, COLOR_KEYS.indexOf(key));
const colorKeyOf = (i: number): string => COLOR_KEYS[i] ?? '';

function encodeElement(w: ByteWriter, el: GridElement): void {
  // a break has no payload; store it as an empty slot tagged with E_BREAK
  let flags = KIND_CODE[el.kind === 'break' ? 'empty' : el.kind];
  if (el.alticon) flags |= E_ALTICON;
  if (el.kind === 'break') flags |= E_BREAK;
  w.u8(flags);
  if (el.kind === 'hero' || el.kind === 'item') w.varint(el.refId ?? 0);
  else if (el.kind === 'custom') w.string(el.tag ?? '');
  if (el.alticon) w.string(el.alticon);
}

function encodeIcon(w: ByteWriter, icon: CategoryIcon): void {
  w.u8(ICON_KIND_CODE[icon.kind]);
  if (icon.kind === 'hero' || icon.kind === 'item') {
    w.varint(icon.refId ?? 0);
    let nf = 0;
    if (icon.alticon) nf |= I_ALTICON;
    if (icon.iconType !== undefined) nf |= I_ICON_TYPE;
    w.u8(nf);
    if (icon.alticon) w.string(icon.alticon);
    if (icon.iconType !== undefined) w.u8(icon.iconType);
  } else {
    w.string(icon.folder ?? '');
    w.string(icon.tag ?? '');
  }
}

function encodeCategory(
  w: ByteWriter,
  c: Category,
  vIndex: Map<string, number>,
  hIndex: Map<string, number>,
): void {
  let flags = 0;
  if (c.preset !== undefined) flags |= C_PRESET;
  if (c.icon) flags |= C_ICON;
  if (c.vGroup) flags |= C_VGROUP;
  if (c.hGroup) flags |= C_HGROUP;
  if (c.newRow) flags |= C_NEWROW;
  if (c.portraitType !== undefined) flags |= C_PORTRAIT;
  if (c.itemStyle !== undefined) flags |= C_ITEMSTYLE;
  if (c.size !== undefined) flags |= C_SIZE;
  w.varint(flags);

  if (c.preset !== undefined) w.varint(c.preset);
  else w.string(c.text ?? '');
  if (c.icon) encodeIcon(w, c.icon);

  w.u8(colorIndexOf(c.color));
  w.u8(c.wideness);
  w.u8(c.headerSize ?? 1);
  if (c.vGroup) w.varint(vIndex.get(c.vGroup) ?? 0);
  if (c.hGroup) w.varint(hIndex.get(c.hGroup) ?? 0);
  if (c.portraitType !== undefined) w.u8(c.portraitType);
  if (c.itemStyle !== undefined) w.u8(c.itemStyle);
  if (c.size !== undefined) w.u8(c.size);

  w.varint(c.elements.length);
  for (const el of c.elements) encodeElement(w, el);
}

/** The raw (uncompressed) binary record for a board. */
export function encodeBoardBytes(board: Board): Uint8Array {
  const w = new ByteWriter();
  w.u8(SHARE_VERSION);

  let bflags = 0;
  if (board.colorfulLabels) bflags |= B_COLORFUL;
  if (board.centered) bflags |= B_CENTERED;
  if (board.darkenedBg) bflags |= B_DARKENED;
  w.u8(bflags);
  w.u8(board.columns);
  w.u8(board.portraitType);
  w.u8(board.itemStyle);
  w.u8(board.size);
  w.string(board.name);
  w.string(board.icon ?? '');
  w.string(board.author ?? '');
  w.string(board.description ?? '');

  // index distinct chain ids per axis as small ints
  const vIndex = new Map<string, number>();
  const hIndex = new Map<string, number>();
  for (const c of board.categories) {
    if (c.vGroup && !vIndex.has(c.vGroup)) vIndex.set(c.vGroup, vIndex.size);
    if (c.hGroup && !hIndex.has(c.hGroup)) hIndex.set(c.hGroup, hIndex.size);
  }

  w.varint(board.categories.length);
  for (const c of board.categories) encodeCategory(w, c, vIndex, hIndex);

  return w.toUint8Array();
}

/** Encode a board to a compact, deflated, URL-safe base64 string. */
export function encodeBoard(board: Board): string {
  return toBase64Url(packBytes(encodeBoardBytes(board)));
}

function decodeElement(r: ByteReader): GridElement {
  const flags = r.u8();
  const kind: ElementKind = flags & E_BREAK ? 'break' : KIND_BY_CODE[flags & E_KIND_MASK] ?? 'hero';
  const el: GridElement = { kind };
  if (kind === 'hero' || kind === 'item') el.refId = r.varint();
  else if (kind === 'custom') el.tag = r.string();
  if (flags & E_ALTICON) el.alticon = r.string();
  return el;
}

function decodeIcon(r: ByteReader): CategoryIcon {
  const kind = ICON_KIND_BY_CODE[r.u8()] ?? 'facet';
  if (kind === 'hero' || kind === 'item') {
    const refId = r.varint();
    const nf = r.u8();
    const icon: CategoryIcon = { kind, refId };
    if (nf & I_ALTICON) icon.alticon = r.string();
    if (nf & I_ICON_TYPE) icon.iconType = r.u8();
    return icon;
  }
  return { kind, folder: r.string(), tag: r.string() };
}

function decodeCategory(r: ByteReader, version: number): Category {
  const flags = r.varint();

  const cat: Category = { id: genId(), color: '', wideness: 0, elements: [] };
  if (flags & C_PRESET) cat.preset = r.varint();
  else cat.text = r.string();
  if (flags & C_ICON) cat.icon = decodeIcon(r);

  cat.color = colorKeyOf(r.u8());
  cat.wideness = r.u8();
  cat.headerSize = r.u8();
  if (version >= 6) {
    if (flags & C_VGROUP) cat.vGroup = `v${r.varint()}`;
    if (flags & C_HGROUP) cat.hGroup = `h${r.varint()}`;
  } else if (flags & C_LINK) {
    // v5: one link group + orientation byte → route to the matching axis
    const g = r.varint();
    if (r.u8() === 1) cat.hGroup = `h${g}`;
    else cat.vGroup = `v${g}`;
  }
  if (flags & C_PORTRAIT) cat.portraitType = r.u8();
  if (flags & C_ITEMSTYLE) cat.itemStyle = r.u8();
  if (flags & C_SIZE) cat.size = r.u8();

  const count = r.varint();
  for (let i = 0; i < count; i++) cat.elements.push(decodeElement(r));
  cat.newRow = !!(flags & C_NEWROW);
  return cat;
}

/** Decode a share string back into a board. Throws on malformed input. */
export function decodeBoard(str: string): Board {
  const r = new ByteReader(unpackBytes(fromBase64Url(str.trim())));
  const version = r.u8();
  if (version !== SHARE_VERSION && !LEGACY_VERSIONS.includes(version))
    throw new Error(`unsupported share version ${version}`);

  const board = emptyBoard();
  const bflags = r.u8();
  board.colorfulLabels = !!(bflags & B_COLORFUL);
  board.centered = !!(bflags & B_CENTERED);
  board.darkenedBg = !!(bflags & B_DARKENED);
  board.columns = r.u8();
  board.portraitType = r.u8();
  board.itemStyle = r.u8();
  board.size = r.u8();
  board.name = r.string();
  board.icon = r.string();
  if (version >= 7) {
    const author = r.string();
    if (author) board.author = author;
  }
  if (version >= 8) {
    const description = r.string();
    if (description) board.description = description;
  }

  const count = r.varint();
  board.categories = [];
  for (let i = 0; i < count; i++) board.categories.push(decodeCategory(r, version));
  return board;
}
