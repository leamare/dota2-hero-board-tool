import type { Board, Category } from '../types/board';
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

/** Does this parsed JSON look like the game's hero grid config? */
export function isGameGrid(parsed: unknown): parsed is GameGridFile {
  if (!parsed || typeof parsed !== 'object') return false;
  const f = parsed as Partial<GameGridFile>;
  if (!Array.isArray(f.configs)) return false;
  return f.configs.every(
    (c) => c && typeof c === 'object' && 'config_name' in c && Array.isArray(c.categories),
  );
}

/** A label for a category that the game can only store as plain text. */
function gameLabel(cat: Category, heroTag: (id: number) => string, itemTag: (id: number) => string): string {
  if (cat.preset !== undefined) return presetLabel(cat.preset);
  if (cat.text?.trim()) return cat.text.trim();
  // an icon has no textual form in the game format — keep it recognisable
  const icon = cat.icon;
  if (!icon) return '';
  if (icon.kind === 'hero' && icon.refId != null) return `S:${heroTag(icon.refId)}`;
  if (icon.kind === 'item' && icon.refId != null) return `S:${itemTag(icon.refId)}`;
  if (icon.tag) return `S:${icon.tag}`;
  return '';
}

export interface ToGameOptions {
  heroTag?: (id: number) => string;
  itemTag?: (id: number) => string;
}

/** Convert saved grids into the game's config file. */
export function toGameGrid(layouts: SavedLayout[], opts: ToGameOptions = {}): GameGridFile {
  const heroTag = opts.heroTag ?? ((id) => String(id));
  const itemTag = opts.itemTag ?? ((id) => String(id));

  const configs = layouts.map((l) => {
    const board = l.board;
    // the game grid is a canvas, so a classic grid needs positions first
    const seeded = board.canvas ? null : seedRects(board);
    const categories: GameCategory[] = board.categories.map((cat) => {
      const rect = cat.rect ?? seeded?.get(cat.id) ?? { x: 0, y: 0, w: 100 / 3, h: 20 };
      return {
        category_name: gameLabel(cat, heroTag, itemTag),
        x_position: +(rect.x / PCT_PER_UNIT).toFixed(6),
        y_position: +(rect.y / PCT_PER_UNIT).toFixed(6),
        width: +(rect.w / PCT_PER_UNIT).toFixed(6),
        height: +(rect.h / PCT_PER_UNIT).toFixed(6),
        // only heroes exist in the game format; items and blanks are dropped
        hero_ids: cat.elements
          .filter((e) => e.kind === 'hero' && e.refId != null)
          .map((e) => e.refId as number),
      };
    });
    return { config_name: l.name || board.name || 'Grid', categories };
  });

  return { version: 3, configs };
}

/** A short stamp appended to imported grids so they don't collide by name. */
export const importStamp = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Read the game's config file into saved grids. Every one is a canvas grid. */
export function fromGameGrid(file: GameGridFile): SavedLayout[] {
  return file.configs.map((cfg) => {
    const categories: Category[] = cfg.categories.map((c) => ({
      id: genId(),
      text: c.category_name ?? '',
      color: '',
      wideness: 0,
      rect: {
        x: (c.x_position || 0) * PCT_PER_UNIT,
        y: (c.y_position || 0) * PCT_PER_UNIT,
        w: (c.width || 0) * PCT_PER_UNIT,
        h: (c.height || 0) * PCT_PER_UNIT,
      },
      elements: (c.hero_ids ?? []).map((id) => ({ kind: 'hero' as const, refId: id })),
    }));

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
