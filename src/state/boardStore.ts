import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Category, GridElement } from '../types/board';
import { emptyBoard, genId, newCategory } from '../lib/board';

interface BoardStore {
  board: Board;
  /** id of the saved layout this board is currently tracking, if any */
  currentLayoutId: string | null;

  setBoard: (board: Board, layoutId?: string | null) => void;
  setCurrentLayoutId: (id: string | null) => void;
  resetBoard: () => void;
  patchBoard: (patch: Partial<Board>) => void;

  addCategory: () => void;
  removeCategory: (id: string) => void;
  patchCategory: (id: string, patch: Partial<Category>) => void;
  reorderCategories: (ids: string[]) => void;
  linkCategories: (aId: string, bId: string, orient: 'v' | 'h') => void;
  unlinkCategory: (id: string) => void;

  addElement: (catId: string, element: GridElement) => void;
  removeElement: (catId: string, index: number) => void;
  patchElement: (catId: string, index: number, patch: Partial<GridElement>) => void;
  reorderElements: (catId: string, indices: number[]) => void;
  moveElement: (
    fromCat: string,
    fromIndex: number,
    toCat: string,
    toIndex: number,
  ) => void;
}

const mapCategory = (
  board: Board,
  id: string,
  fn: (c: Category) => Category,
): Category[] => board.categories.map((c) => (c.id === id ? fn(c) : c));

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      board: emptyBoard(),
      currentLayoutId: null,

      setBoard: (board, layoutId) =>
        set(layoutId === undefined ? { board } : { board, currentLayoutId: layoutId }),
      setCurrentLayoutId: (id) => set({ currentLayoutId: id }),
      resetBoard: () => set({ board: emptyBoard(), currentLayoutId: null }),
      patchBoard: (patch) => set((s) => ({ board: { ...s.board, ...patch } })),

      addCategory: () =>
        set((s) => ({
          board: { ...s.board, categories: [...s.board.categories, newCategory()] },
        })),

      removeCategory: (id) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: s.board.categories.filter((c) => c.id !== id),
          },
        })),

      patchCategory: (id, patch) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: mapCategory(s.board, id, (c) => ({ ...c, ...patch })),
          },
        })),

      reorderCategories: (ids) =>
        set((s) => {
          const byId = new Map(s.board.categories.map((c) => [c.id, c]));
          const next = ids.map((id) => byId.get(id)).filter((c): c is Category => !!c);
          return { board: { ...s.board, categories: next } };
        }),

      linkCategories: (aId, bId, orient) =>
        set((s) => {
          if (aId === bId) return s;
          const b = s.board.categories.find((c) => c.id === bId);
          const a = s.board.categories.find((c) => c.id === aId);
          if (!a || !b) return s;
          // join b's group if it already has one of the same orientation
          const group = b.linkGroup && b.linkOrient === orient ? b.linkGroup : genId();
          const cats = s.board.categories.map((c) => {
            if (c.id === aId || c.id === bId) return { ...c, linkGroup: group, linkOrient: orient };
            return c;
          });
          // place a right after the last existing member of the group for tidy order
          const moved = cats.find((c) => c.id === aId)!;
          const rest = cats.filter((c) => c.id !== aId);
          let insertAt = rest.length;
          rest.forEach((c, i) => {
            if (c.linkGroup === group) insertAt = i + 1;
          });
          rest.splice(insertAt, 0, moved);
          return { board: { ...s.board, categories: rest } };
        }),

      unlinkCategory: (id) =>
        set((s) => {
          const cat = s.board.categories.find((c) => c.id === id);
          if (!cat?.linkGroup) return s;
          const group = cat.linkGroup;
          let cats = s.board.categories.map((c) =>
            c.id === id ? { ...c, linkGroup: undefined, linkOrient: undefined } : c,
          );
          // dissolve the group if only one member is left
          const remaining = cats.filter((c) => c.linkGroup === group);
          if (remaining.length === 1) {
            cats = cats.map((c) =>
              c.linkGroup === group ? { ...c, linkGroup: undefined, linkOrient: undefined } : c,
            );
          }
          return { board: { ...s.board, categories: cats } };
        }),

      addElement: (catId, element) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: mapCategory(s.board, catId, (c) => ({
              ...c,
              elements: [...c.elements, element],
            })),
          },
        })),

      removeElement: (catId, index) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: mapCategory(s.board, catId, (c) => ({
              ...c,
              elements: c.elements.filter((_, i) => i !== index),
            })),
          },
        })),

      patchElement: (catId, index, patch) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: mapCategory(s.board, catId, (c) => ({
              ...c,
              elements: c.elements.map((el, i) => (i === index ? { ...el, ...patch } : el)),
            })),
          },
        })),

      reorderElements: (catId, indices) =>
        set((s) => ({
          board: {
            ...s.board,
            categories: mapCategory(s.board, catId, (c) => ({
              ...c,
              elements: indices.map((i) => c.elements[i]).filter(Boolean),
            })),
          },
        })),

      moveElement: (fromCat, fromIndex, toCat, toIndex) =>
        set((s) => {
          const source = s.board.categories.find((c) => c.id === fromCat);
          if (!source) return s;
          const moved = source.elements[fromIndex];
          if (!moved) return s;
          const categories = s.board.categories.map((c) => {
            if (c.id === fromCat && fromCat === toCat) {
              const rest = c.elements.filter((_, i) => i !== fromIndex);
              rest.splice(toIndex, 0, moved);
              return { ...c, elements: rest };
            }
            if (c.id === fromCat) {
              return { ...c, elements: c.elements.filter((_, i) => i !== fromIndex) };
            }
            if (c.id === toCat) {
              const rest = [...c.elements];
              rest.splice(toIndex, 0, moved);
              return { ...c, elements: rest };
            }
            return c;
          });
          return { board: { ...s.board, categories } };
        }),
    }),
    {
      name: 'hgt.board',
      version: 3,
      migrate: (persisted, from) => {
        const state = persisted as { board?: Record<string, unknown> };
        if (!state?.board) return persisted as unknown as { board: Board };
        const b = state.board as Record<string, unknown> & { categories?: Record<string, unknown>[] };

        // v1 -> v2: heroStyle/itemStyle/bigger -> portraitType/itemStyle/size
        if (from < 2) {
          const itemMap = (v: unknown) => (v === 4 ? 1 : 0);
          b.portraitType = typeof b.heroStyle === 'number' ? Math.min(2, b.heroStyle) : 0;
          b.itemStyle = itemMap(b.itemStyle);
          b.size = 0;
          b.categories = (b.categories ?? []).map((c) => {
            const cat = c as Record<string, unknown>;
            if (typeof cat.heroStyle === 'number') cat.portraitType = Math.min(2, cat.heroStyle);
            if (typeof cat.itemStyle === 'number') cat.itemStyle = itemMap(cat.itemStyle);
            if (cat.bigger) cat.size = 2;
            delete cat.heroStyle;
            delete cat.bigger;
            return cat;
          });
          delete b.heroStyle;
        }

        // v2 -> v3: connectedNext runs -> vertical link groups
        if (from < 3) {
          const cats = (b.categories ?? []) as Record<string, unknown>[];
          let group: string | null = null;
          for (let i = 0; i < cats.length; i++) {
            const c = cats[i];
            const prev = cats[i - 1];
            if (prev && prev.connectedNext) {
              c.linkGroup = group;
              c.linkOrient = 'v';
            }
            if (c.connectedNext) {
              if (!prev || !prev.connectedNext) group = `mig-${i}`;
              c.linkGroup = group;
              c.linkOrient = 'v';
            }
            delete c.connectedNext;
          }
        }

        return { board: b as unknown as Board };
      },
    },
  ),
);
