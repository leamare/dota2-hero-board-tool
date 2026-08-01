import type { Board } from '../types/board';
import type { SavedLayout } from '../state/layoutsStore';
import { decodeBoard } from './share';
import { decodeLayouts } from './layoutsShare';
import { convertLegacyLayouts, isLegacyLayouts, type LegacySettings } from './legacyImport';
import { fromGameGrid, isGameGrid } from './gameGrid';
import { genId } from './board';

/**
 * One entry point for every way a grid can arrive: a share link or bare board
 * code, an "all grids" link or code, a JSON export from this tool, or a JSON
 * export from the original AngularJS tool.
 */
/**
 * Parse a run of JSON objects that isn't wrapped in an array — `{…},{…},` and
 * friends. Returns the list, or null if it isn't that either.
 */
function parseObjectSequence(text: string): unknown[] | null {
  const body = text.replace(/,\s*$/, '');
  try {
    const list = JSON.parse(`[${body}]`) as unknown[];
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

export function parseImport(input: string, legacy: LegacySettings = {}): SavedLayout[] {
  const text = input.trim();
  if (!text) throw new Error('Nothing to import.');

  // --- JSON: current export shapes, or the legacy tool's layout list ---
  if (text.startsWith('[') || text.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // a hand-made file is often a slice out of hero_grid_config.json's
      // `configs` array: several objects in a row, sometimes with a trailing
      // comma. That is not valid JSON on its own, but the array around it is.
      parsed = parseObjectSequence(text);
      if (parsed === null) throw new Error('That looks like JSON but could not be parsed.');
    }
    if (isGameGrid(parsed)) return fromGameGrid(parsed);
    if (isLegacyLayouts(parsed)) return convertLegacyLayouts(parsed, legacy);
    return asSavedLayouts(parsed);
  }

  // --- links: ?b= (single grid) or ?l= (all grids) ---
  const b = /[?&]b=([^&\s]+)/.exec(text);
  if (b) return [layoutFromBoard(decodeBoard(b[1]))];
  const l = /[?&]l=([^&\s]+)/.exec(text);
  if (l) return decodeLayouts(l[1]);

  // --- bare code: try a board first, then a layouts blob ---
  try {
    return [layoutFromBoard(decodeBoard(text))];
  } catch {
    /* not a board code — fall through */
  }
  try {
    return decodeLayouts(text);
  } catch {
    throw new Error('Unrecognised grid data.');
  }
}

const layoutFromBoard = (board: Board): SavedLayout => ({
  id: genId(),
  name: board.name || 'Imported grid',
  board,
});

/** Accept a saved-layout list, a single saved layout, or a bare board. */
function asSavedLayouts(parsed: unknown): SavedLayout[] {
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const out: SavedLayout[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Partial<SavedLayout> & Partial<Board>;
    if (e.board) {
      out.push({ id: e.id || genId(), name: e.name || e.board.name || 'Imported grid', board: e.board });
    } else if (Array.isArray(e.categories)) {
      out.push(layoutFromBoard(entry as Board));
    }
  }
  if (out.length === 0) throw new Error('No grids found in that data.');
  return out;
}
