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
  importLayouts: (incoming: SavedLayout[]) => void;
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

      importLayouts: (incoming) =>
        set((s) => ({
          layouts: [
            ...s.layouts,
            ...incoming.map((l) => ({ ...clone(l), id: genId() })),
          ],
        })),
    }),
    { name: 'hgt.layouts', version: 1 },
  ),
);
