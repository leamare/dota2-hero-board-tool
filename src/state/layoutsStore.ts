import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board } from '../types/board';
import { genId } from '../lib/board';

export interface SavedLayout {
  id: string;
  name: string;
  board: Board;
}

interface LayoutsStore {
  layouts: SavedLayout[];
  /** snapshot a board under a name; returns the new layout id */
  save: (name: string, board: Board) => string;
  /** overwrite an existing layout's board */
  overwrite: (id: string, board: Board) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** move the layout at `from` to sit at `to` in the saved list */
  reorder: (from: number, to: number) => void;
  /** merge imported layouts (from a JSON file) */
  /**
   * Merge imported grids. By default a grid whose name already exists is kept
   * separate, stamped with the import time; `replaceSameName` overwrites the
   * existing one instead.
   */
  importLayouts: (incoming: SavedLayout[], opts?: { replaceSameName?: boolean; stamp?: string }) => void;
}

const clone = <T,>(v: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));

export const useLayoutsStore = create<LayoutsStore>()(
  persist(
    (set) => ({
      layouts: [],

      save: (name, board) => {
        const id = genId();
        set((s) => ({ layouts: [...s.layouts, { id, name, board: clone(board) }] }));
        return id;
      },

      overwrite: (id, board) =>
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === id ? { ...l, board: clone(board) } : l)),
        })),

      rename: (id, name) =>
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === id ? { ...l, name } : l)),
        })),

      remove: (id) => set((s) => ({ layouts: s.layouts.filter((l) => l.id !== id) })),

      reorder: (from, to) =>
        set((s) => {
          const layouts = [...s.layouts];
          const [moved] = layouts.splice(from, 1);
          if (!moved) return s;
          layouts.splice(to, 0, moved);
          return { layouts };
        }),

      importLayouts: (incoming, opts = {}) =>
        set((s) => {
          const layouts = [...s.layouts];
          for (const raw of incoming) {
            const copy = { ...clone(raw), id: genId() };
            const clash = layouts.findIndex((l) => l.name === copy.name);
            if (clash < 0) {
              layouts.push(copy);
            } else if (opts.replaceSameName) {
              layouts[clash] = { ...copy, id: layouts[clash].id };
            } else {
              const name = opts.stamp ? `${copy.name} ${opts.stamp}` : copy.name;
              layouts.push({ ...copy, name, board: { ...copy.board, name } });
            }
          }
          return { layouts };
        }),
    }),
    { name: 'hgt.layouts', version: 1 },
  ),
);
