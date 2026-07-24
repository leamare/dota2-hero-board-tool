import type {
  Board,
  Category,
  CategoryName,
  CategoryNameType,
  GridElement,
} from '../types/board';
import { emptyBoard, genId } from './board';
import { ByteReader, ByteWriter, fromBase64Url, toBase64Url } from './bytes';
import type { ElementKind } from './images';

const SHARE_VERSION = 3;

const NAME_TYPE_CODE: Record<CategoryNameType, number> = { text: 0, preset: 1, hero: 2, item: 3 };
const NAME_TYPE_BY_CODE: CategoryNameType[] = ['text', 'preset', 'hero', 'item'];
const KIND_CODE: Record<ElementKind, number> = { hero: 0, item: 1, empty: 2, custom: 3 };
const KIND_BY_CODE: ElementKind[] = ['hero', 'item', 'empty', 'custom'];

// board flag bits
const B_COLORFUL = 1;
const B_CENTERED = 2;
const B_DARKENED = 4;

// name flag bits (hero/item labels)
const N_ALTICON = 1;
const N_ICON_TYPE = 2;

// category flag bits
const C_LINK = 1;
const C_SEP_AFTER = 2;
const C_SEP_RIGHT = 4;
const C_NEWROW = 8;
const C_PORTRAIT = 16;
const C_ITEMSTYLE = 32;
const C_SIZE = 64;

// element flag bits (kind in low 2 bits)
const E_KIND_MASK = 3;
const E_ALTICON = 4;

// colour keys in the same fixed order as LABEL_COLORS (see constants.ts).
const COLOR_KEYS = [
  '', 'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
  'violet', 'purple', 'pink', 'brown', 'grey', 'black',
];
const colorIndexOf = (key: string): number => Math.max(0, COLOR_KEYS.indexOf(key));
const colorKeyOf = (i: number): string => COLOR_KEYS[i] ?? '';

function encodeElement(w: ByteWriter, el: GridElement): void {
  let flags = KIND_CODE[el.kind];
  if (el.alticon) flags |= E_ALTICON;
  w.u8(flags);
  if (el.kind === 'hero' || el.kind === 'item') w.varint(el.refId ?? 0);
  else if (el.kind === 'custom') w.string(el.tag ?? '');
  if (el.alticon) w.string(el.alticon);
}

function encodeName(w: ByteWriter, name: CategoryName): void {
  w.u8(NAME_TYPE_CODE[name.type]);
  if (name.type === 'text') w.string(name.text ?? '');
  else if (name.type === 'preset') w.varint(name.preset ?? 0);
  else {
    w.varint(name.refId ?? 0);
    let nf = 0;
    if (name.alticon) nf |= N_ALTICON;
    if (name.iconType !== undefined) nf |= N_ICON_TYPE;
    w.u8(nf);
    if (name.alticon) w.string(name.alticon);
    if (name.iconType !== undefined) w.u8(name.iconType);
  }
}

function encodeCategory(w: ByteWriter, c: Category, groupIndex: Map<string, number>): void {
  encodeName(w, c.name);
  w.u8(colorIndexOf(c.color));
  w.u8(c.wideness);
  w.u8(c.headerSize ?? 1);

  let flags = 0;
  if (c.linkGroup) flags |= C_LINK;
  if (c.separatorAfter) flags |= C_SEP_AFTER;
  if (c.separatorRight) flags |= C_SEP_RIGHT;
  if (c.newRow) flags |= C_NEWROW;
  if (c.portraitType !== undefined) flags |= C_PORTRAIT;
  if (c.itemStyle !== undefined) flags |= C_ITEMSTYLE;
  if (c.size !== undefined) flags |= C_SIZE;
  w.u8(flags);
  if (c.linkGroup) {
    w.varint(groupIndex.get(c.linkGroup) ?? 0);
    w.u8(c.linkOrient === 'h' ? 1 : 0);
  }
  if (c.portraitType !== undefined) w.u8(c.portraitType);
  if (c.itemStyle !== undefined) w.u8(c.itemStyle);
  if (c.size !== undefined) w.u8(c.size);

  w.varint(c.elements.length);
  for (const el of c.elements) encodeElement(w, el);
}

/** Encode a board to a compact URL-safe base64 string. */
export function encodeBoard(board: Board): string {
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

  // index distinct link groups as small ints
  const groupIndex = new Map<string, number>();
  for (const c of board.categories) {
    if (c.linkGroup && !groupIndex.has(c.linkGroup)) groupIndex.set(c.linkGroup, groupIndex.size);
  }

  w.varint(board.categories.length);
  for (const c of board.categories) encodeCategory(w, c, groupIndex);

  return toBase64Url(w.toUint8Array());
}

function decodeElement(r: ByteReader): GridElement {
  const flags = r.u8();
  const kind = KIND_BY_CODE[flags & E_KIND_MASK] ?? 'hero';
  const el: GridElement = { kind };
  if (kind === 'hero' || kind === 'item') el.refId = r.varint();
  else if (kind === 'custom') el.tag = r.string();
  if (flags & E_ALTICON) el.alticon = r.string();
  return el;
}

function decodeName(r: ByteReader): CategoryName {
  const type = NAME_TYPE_BY_CODE[r.u8()] ?? 'text';
  const name: CategoryName = { type };
  if (type === 'text') name.text = r.string();
  else if (type === 'preset') name.preset = r.varint();
  else {
    name.refId = r.varint();
    const nf = r.u8();
    if (nf & N_ALTICON) name.alticon = r.string();
    if (nf & N_ICON_TYPE) name.iconType = r.u8();
  }
  return name;
}

function decodeCategory(r: ByteReader): Category {
  const name = decodeName(r);
  const color = colorKeyOf(r.u8());
  const wideness = r.u8();
  const headerSize = r.u8();
  const flags = r.u8();
  let linkGroup: string | undefined;
  let linkOrient: 'v' | 'h' | undefined;
  if (flags & C_LINK) {
    linkGroup = `g${r.varint()}`;
    linkOrient = r.u8() === 1 ? 'h' : 'v';
  }
  const portraitType = flags & C_PORTRAIT ? r.u8() : undefined;
  const itemStyleOv = flags & C_ITEMSTYLE ? r.u8() : undefined;
  const size = flags & C_SIZE ? r.u8() : undefined;

  const count = r.varint();
  const elements: GridElement[] = [];
  for (let i = 0; i < count; i++) elements.push(decodeElement(r));

  return {
    id: genId(),
    name,
    color,
    wideness,
    headerSize,
    portraitType,
    itemStyle: itemStyleOv,
    size,
    linkGroup,
    linkOrient,
    separatorAfter: !!(flags & C_SEP_AFTER),
    separatorRight: !!(flags & C_SEP_RIGHT),
    newRow: !!(flags & C_NEWROW),
    elements,
  };
}

/** Decode a share string back into a board. Throws on malformed input. */
export function decodeBoard(str: string): Board {
  const r = new ByteReader(fromBase64Url(str.trim()));
  const version = r.u8();
  if (version !== SHARE_VERSION) throw new Error(`unsupported share version ${version}`);

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

  const count = r.varint();
  board.categories = [];
  for (let i = 0; i < count; i++) board.categories.push(decodeCategory(r));
  return board;
}
