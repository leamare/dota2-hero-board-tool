import { describe, expect, it, vi } from 'vitest';
import { emptyBoard } from '../lib/board';

/*
 * A version bump only ever rewrites `board` — `currentLayoutId` has to survive
 * a migration untouched, or the open board silently unlinks from its saved
 * grid: the next Save then creates a new entry instead of updating the old
 * one, leaving a stale name in the grids list (the bug this file guards).
 *
 * Rehydration reads localStorage synchronously at store creation, so the stub
 * (and the persisted payload) has to be in place before `./boardStore` is
 * imported — hence the dynamic import after both are set up, same reasoning
 * as layoutsStore.test.ts.
 */
const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
});

const board = emptyBoard('Migrated Grid');
// version 4: predates the v4->v5 linkGroup/linkOrient migration step, so the
// migrate function actually has work to do on `board` while this runs
memory.set(
  'hgt.board',
  JSON.stringify({ state: { board, currentLayoutId: 'saved-layout-id' }, version: 4 }),
);

const { useBoardStore } = await import('./boardStore');

describe('boardStore persisted-version migration', () => {
  it('keeps currentLayoutId linked to its saved grid across a migration', () => {
    const state = useBoardStore.getState();
    expect(state.currentLayoutId).toBe('saved-layout-id');
    expect(state.board.name).toBe('Migrated Grid');
  });
});
