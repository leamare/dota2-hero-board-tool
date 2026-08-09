import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyBoard } from '../lib/board';

/*
 * `name` (shown in the grids list) and `board.name` (shown everywhere else —
 * the sidebar field, the view/edit heading) are two copies of the same fact.
 * Every write has to keep them equal, or a rename done through one path goes
 * unnoticed in the other — see the bug this file guards against.
 *
 * The store persists to localStorage, which this (node) test environment
 * doesn't provide. zustand's `persist` reads it once, at module load, so the
 * stub has to exist before `./layoutsStore` is imported — a dynamic import
 * after the stub, rather than a static one (which ES modules hoist above
 * everything in the file, stub included).
 */
const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
});

const { useLayoutsStore } = await import('./layoutsStore');

const reset = () => useLayoutsStore.setState({ layouts: [] });

describe('layoutsStore name / board.name sync', () => {
  beforeEach(reset);

  it('picks up a rename made through the board (save, autosave) in the grids list', () => {
    const { save, overwrite } = useLayoutsStore.getState();
    const id = save('Original', emptyBoard('Original'));

    // the sidebar name field only patches board.name — this is what autosave
    // and the Save button then write back with
    overwrite(id, { ...emptyBoard('Original'), name: 'Renamed via board' });

    const layout = useLayoutsStore.getState().layouts.find((l) => l.id === id)!;
    expect(layout.name).toBe('Renamed via board');
    expect(layout.board.name).toBe('Renamed via board');
  });

  it('keeps board.name in step with an explicit rename from the grids list', () => {
    const { save, rename } = useLayoutsStore.getState();
    const id = save('Original', emptyBoard('Original'));

    rename(id, 'Renamed via list');

    const layout = useLayoutsStore.getState().layouts.find((l) => l.id === id)!;
    expect(layout.name).toBe('Renamed via list');
    expect(layout.board.name).toBe('Renamed via list');
  });

  it('does not blank the list name when a board carries an empty one', () => {
    const { save, overwrite } = useLayoutsStore.getState();
    const id = save('Keep me', emptyBoard('Keep me'));

    // an in-progress edit (e.g. a cleared name field mid-typing) shouldn't
    // wipe out what the list already shows
    overwrite(id, { ...emptyBoard(''), name: '' });

    expect(useLayoutsStore.getState().layouts.find((l) => l.id === id)!.name).toBe('Keep me');
  });
});
