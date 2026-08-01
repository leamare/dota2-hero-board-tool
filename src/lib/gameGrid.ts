import type { Board, Category, CategoryIcon } from '../types/board';
import type { SavedLayout } from '../state/layoutsStore';
import { emptyBoard, genId } from './board';
import { presetLabel } from './constants';
import { seedRects } from './canvas';
import { VERTICAL_PORTRAITS } from './images';

/**
 * Dota 2's own `hero_grid_config.json`, as written by the game client:
 *
 *   { version: 3, configs: [ { config_name, categories: [
 *       { category_name, x_position, y_position, width, height, hero_ids } ] } ] }
 *
 * Positions are in the client's grid units. Every config the game writes ends
 * a hair under 1200 units wide, so that is the canvas width we scale against —
 * our rects are percentages of the canvas width, hence the /12.
 *
 * The game format only knows hero ids and a plain category name, so items,
 * alternate portraits, colours and per-category styling cannot survive a round
 * trip. Category icons are written out as `S:<tag>` so they at least stay
 * recognisable as text.
 */

export const GAME_CANVAS_UNITS = 1200;
const PCT_PER_UNIT = 100 / GAME_CANVAS_UNITS;

/**
 * Breathing room left below every box on the way out, in game units. Our rows
 * sit flush against each other, which crowds the category names in the client;
 * carving a little off each height separates them without moving anything.
 * Importing adds it straight back, so a round trip returns the original.
 */
export const GAME_ROW_GAP_UNITS = 22;
const GAP_PCT = GAME_ROW_GAP_UNITS * PCT_PER_UNIT;

/** Where the game keeps the file, shown in the import/export dialogs. */
export const GAME_CONFIG_PATH =
  '<Steam install folder>/userdata/<steam account ID>/570/remote/cfg/hero_grid_config.json';
export const GAME_CONFIG_FILENAME = 'hero_grid_config.json';

interface GameCategory {
  category_name: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  hero_ids: number[];
}

interface GameConfig {
  config_name: string;
  categories: GameCategory[];
}

export interface GameGridFile {
  version: number;
  configs: GameConfig[];
}

const isConfig = (c: unknown): c is GameConfig =>
  !!c && typeof c === 'object' && 'config_name' in c && Array.isArray((c as GameConfig).categories);

/**
 * Does this parsed JSON look like the game's hero grid config?
 *
 * Accepts the whole file, a bare `configs` array, or a single config object —
 * people routinely share one grid by copying it out of the array.
 */
export function isGameGrid(parsed: unknown): parsed is GameGridFile {
  if (!parsed || typeof parsed !== 'object') return false;
  if (Array.isArray(parsed)) return parsed.length > 0 && parsed.every(isConfig);
  if (isConfig(parsed)) return true;
  const f = parsed as Partial<GameGridFile>;
  return Array.isArray(f.configs) && f.configs.every(isConfig);
}

/** Normalise any of the accepted shapes into the full file shape. */
export function asGameGrid(parsed: GameGridFile | GameConfig | GameConfig[]): GameGridFile {
  if (Array.isArray(parsed)) return { version: 3, configs: parsed };
  if (isConfig(parsed)) return { version: 3, configs: [parsed] };
  return parsed;
}

/**
 * Icons have no textual form in the game format, so they travel as `{S:<tag>}`
 * — e.g. a Spectre icon becomes `{S:spectre}` — and are turned back into icons
 * on the way in.
 */
const ICON_LABEL = /^\{S:([^}]+)\}\s*/;
export const iconLabel = (tag: string): string => `{S:${tag}}`;

/** The `{S:tag}` marker for a category's icon, if it has one. */
function iconMarker(
  cat: Category,
  heroTag: (id: number) => string,
  itemTag: (id: number) => string,
): string {
  const icon = cat.icon;
  if (!icon) return '';
  if (icon.kind === 'hero' && icon.refId != null) return iconLabel(heroTag(icon.refId));
  if (icon.kind === 'item' && icon.refId != null) return iconLabel(itemTag(icon.refId));
  if (icon.tag) return iconLabel(icon.tag);
  return '';
}

/**
 * A label for a category that the game can only store as plain text. A category
 * can have both an icon and a name, so the marker is prefixed to the text
 * rather than replacing it, and both come back on import.
 */
function gameLabel(cat: Category, heroTag: (id: number) => string, itemTag: (id: number) => string): string {
  const text = cat.preset !== undefined ? presetLabel(cat.preset) : (cat.text?.trim() ?? '');
  return [iconMarker(cat, heroTag, itemTag), text].filter(Boolean).join(' ');
}

/**
 * Resolves a courier tag back to a hero or item, so `{S:spectre}` becomes an
 * icon again. Registered by the metadata provider once names are loaded; until
 * then the label is kept as plain text.
 */
export type TagResolver = (tag: string) => CategoryIcon | null;
let tagResolver: TagResolver | null = null;
export const setTagResolver = (fn: TagResolver | null): void => {
  tagResolver = fn;
};

/** Split a game category name back into the icon and text it came from. */
function readLabel(name: string): Pick<Category, 'text' | 'icon'> {
  const trimmed = (name ?? '').trim();
  const match = ICON_LABEL.exec(trimmed);
  if (!match) return { text: trimmed };
  const icon = tagResolver?.(match[1]);
  // no metadata to resolve it against — keep the marker as text rather than lose it
  if (!icon) return { text: trimmed };
  const rest = trimmed.slice(match[0].length).trim();
  return rest ? { icon, text: rest } : { icon };
}

export interface ToGameOptions {
  heroTag?: (id: number) => string;
  itemTag?: (id: number) => string;
}

/** Name the game gives the continuation of a category split by a row break. */
export const BREAK_CATEGORY_NAME = '------';

/** Hero ids per block, split on row breaks (blocks with no heroes are dropped). */
function heroBlocks(cat: Category): number[][] {
  const blocks: number[][] = [[]];
  for (const el of cat.elements) {
    if (el.kind === 'break') blocks.push([]);
    // only heroes exist in the game format; items and blanks are dropped
    else if (el.kind === 'hero' && el.refId != null) blocks[blocks.length - 1].push(el.refId);
  }
  const kept = blocks.filter((b) => b.length > 0);
  return kept.length ? kept : [[]];
}

/**
 * Convert saved grids into the game's config file.
 *
 * The game has no row breaks, so a category containing one is written as
 * several stacked boxes: the first keeps the label, the rest are named
 * `------` and hold what followed each break. This only applies on the way out
 * to the game — the canvas conversion leaves breaks alone.
 */
export function toGameGrid(layouts: SavedLayout[], opts: ToGameOptions = {}): GameGridFile {
  const heroTag = opts.heroTag ?? ((id) => String(id));
  const itemTag = opts.itemTag ?? ((id) => String(id));

  // the game keys grids by name, so duplicates would shadow each other
  const usedNames = new Set<string>();
  const uniqueName = (want: string): string => {
    const base = want || 'Grid';
    if (!usedNames.has(base)) {
      usedNames.add(base);
      return base;
    }
    for (let n = 2; ; n++) {
      const candidate = `${base} (${n})`;
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }
  };

  const configs = layouts.map((l) => {
    const board = l.board;
    // the game grid is a canvas, so a classic grid needs positions first
    const seeded = board.canvas ? null : seedRects(board);
    const categories: GameCategory[] = [];

    for (const cat of board.categories) {
      const rect = cat.rect ?? seeded?.get(cat.id) ?? { x: 0, y: 0, w: 100 / 3, h: 20 };
      const blocks = heroBlocks(cat);
      const total = blocks.reduce((s, b) => s + b.length, 0) || 1;
      let y = rect.y;

      blocks.forEach((heroes, i) => {
        // each block takes the share of the height its heroes need
        const share = i === blocks.length - 1 ? rect.y + rect.h - y : (heroes.length / total) * rect.h;
        // leave a gap under the box, but never shrink it past being usable
        const drawn = Math.max(share * 0.6, share - GAP_PCT);
        categories.push({
          category_name: i === 0 ? gameLabel(cat, heroTag, itemTag) : BREAK_CATEGORY_NAME,
          x_position: +(rect.x / PCT_PER_UNIT).toFixed(6),
          y_position: +(y / PCT_PER_UNIT).toFixed(6),
          width: +(rect.w / PCT_PER_UNIT).toFixed(6),
          height: +(drawn / PCT_PER_UNIT).toFixed(6),
          hero_ids: heroes,
        });
        y += share;
      });
    }

    return { config_name: uniqueName(l.name || board.name || 'Grid'), categories };
  });

  return { version: 3, configs };
}

/** A short stamp appended to imported grids so they don't collide by name. */
export const importStamp = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Read the game's config file into saved grids. Every one is a canvas grid.
 *
 * The two conventions we write out are read back here: `{S:<tag>}` names become
 * category icons again, and a run of `------` boxes is folded back into the
 * category above it as row breaks, restoring the original single card.
 */
export function fromGameGrid(input: GameGridFile | GameConfig | GameConfig[]): SavedLayout[] {
  const file = asGameGrid(input);
  return file.configs.map((cfg) => {
    const categories: Category[] = [];
    for (const c of cfg.categories) {
      const rect = {
        x: (c.x_position || 0) * PCT_PER_UNIT,
        y: (c.y_position || 0) * PCT_PER_UNIT,
        w: (c.width || 0) * PCT_PER_UNIT,
        // the gap we leave on the way out belongs to the card, so take it back
        h: (c.height || 0) * PCT_PER_UNIT + GAP_PCT,
      };
      const heroes = (c.hero_ids ?? []).map((id) => ({ kind: 'hero' as const, refId: id }));
      const previous = categories[categories.length - 1];

      if (c.category_name?.trim() === BREAK_CATEGORY_NAME && previous) {
        // a continuation block: re-join it to the card above with a break
        previous.elements.push({ kind: 'break' }, ...heroes);
        const r = previous.rect!;
        r.h = Math.max(r.h, rect.y + rect.h - r.y);
        r.w = Math.max(r.w, rect.w);
        continue;
      }

      categories.push({
        id: genId(),
        ...readLabel(c.category_name ?? ''),
        color: '',
        wideness: 0,
        rect,
        elements: heroes,
      });
    }

    const board: Board = {
      ...emptyBoard(cfg.config_name || 'Imported grid'),
      // in-game grids are freeform, so they arrive as canvas grids
      canvas: true,
      // the file carries no portrait style; vertical reads best for imports
      portraitType: VERTICAL_PORTRAITS,
      categories,
    };
    return { id: genId(), name: board.name, board };
  });
}
