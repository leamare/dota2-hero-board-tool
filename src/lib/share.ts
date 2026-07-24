import type { Board, Category, CategoryNameType, GridElement } from '../types/board';
import { emptyBoard, genId } from './board';
import { ByteReader, ByteWriter, fromBase64Url, toBase64Url } from './bytes';

const SHARE_VERSION = 1;

const NAME_TYPE_CODE: Record<CategoryNameType, number> = {
  text: 0,
  preset: 1,
  hero: 2,
  item: 3,
};
const NAME_TYPE_BY_CODE: CategoryNameType[] = ['text', 'preset', 'hero', 'item'];

// board flag bits
const B_COLORFUL = 1;
const B_CENTERED = 2;
const B_DARKENED = 4;

// category flag bits
const C_BIGGER = 1;
const C_SEPARATOR = 2;
const C_NEWROW = 4;
const C_HERO_STYLE = 8;
const C_ITEM_STYLE = 16;

// element flag bits
const E_ITEM = 1;
const E_ALTICON = 2;

// colour keys in the same fixed order as LABEL_COLORS (see constants.ts).
// kept local so the binary layout never shifts if the UI list is reordered.
const COLOR_KEYS = [
  '', 'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
  'violet', 'purple', 'pink', 'brown', 'grey', 'black',
];
const colorIndexOf = (key: string): number => COLOR_KEYS.indexOf(key);
const colorKeyOf = (i: number): string => COLOR_KEYS[i] ?? '';

function encodeElement(w: ByteWriter, el: GridElement): void {
  let flags = 0;
  if (el.kind === 'item') flags |= E_ITEM;
  if (el.alticon) flags |= E_ALTICON;
  w.u8(flags).varint(el.refId);
  if (el.alticon) w.string(el.alticon);
}

function encodeCategory(w: ByteWriter, c: Category): void {
  w.u8(NAME_TYPE_CODE[c.name.type]);
  switch (c.name.type) {
    case 'text':
      w.string(c.name.text ?? '');
      break;
    case 'preset':
      w.varint(c.name.preset ?? 0);
      break;
    case 'hero':
    case 'item':
      w.varint(c.name.refId ?? 0);
      break;
  }

  w.u8(Math.max(0, colorIndexOf(c.color)));
  w.u8(c.wideness);

  let flags = 0;
  if (c.bigger) flags |= C_BIGGER;
  if (c.separatorAfter) flags |= C_SEPARATOR;
  if (c.newRow) flags |= C_NEWROW;
  if (c.heroStyle !== undefined) flags |= C_HERO_STYLE;
  if (c.itemStyle !== undefined) flags |= C_ITEM_STYLE;
  w.u8(flags);
  if (c.heroStyle !== undefined) w.u8(c.heroStyle);
  if (c.itemStyle !== undefined) w.u8(c.itemStyle);

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
  w.u8(board.heroStyle);
  w.u8(board.itemStyle);
  w.string(board.name);

  w.varint(board.categories.length);
  for (const c of board.categories) encodeCategory(w, c);

  return toBase64Url(w.toUint8Array());
}

function decodeElement(r: ByteReader): GridElement {
  const flags = r.u8();
  const refId = r.varint();
  const el: GridElement = { kind: flags & E_ITEM ? 'item' : 'hero', refId };
  if (flags & E_ALTICON) el.alticon = r.string();
  return el;
}

function decodeCategory(r: ByteReader): Category {
  const type = NAME_TYPE_BY_CODE[r.u8()] ?? 'text';
  const name: Category['name'] = { type };
  if (type === 'text') name.text = r.string();
  else if (type === 'preset') name.preset = r.varint();
  else name.refId = r.varint();

  const color = colorKeyOf(r.u8());
  const wideness = r.u8();
  const flags = r.u8();
  const heroStyle = flags & C_HERO_STYLE ? r.u8() : undefined;
  const itemStyle = flags & C_ITEM_STYLE ? r.u8() : undefined;

  const count = r.varint();
  const elements: GridElement[] = [];
  for (let i = 0; i < count; i++) elements.push(decodeElement(r));

  return {
    id: genId(),
    name,
    color,
    wideness,
    bigger: !!(flags & C_BIGGER),
    separatorAfter: !!(flags & C_SEPARATOR),
    newRow: !!(flags & C_NEWROW),
    heroStyle,
    itemStyle,
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
  board.heroStyle = r.u8();
  board.itemStyle = r.u8();
  board.name = r.string();

  const count = r.varint();
  board.categories = [];
  for (let i = 0; i < count; i++) board.categories.push(decodeCategory(r));
  return board;
}
