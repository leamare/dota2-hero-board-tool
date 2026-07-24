import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Category, GridElement } from '../types/board';
import { emptyBoard, newCategory } from '../lib/board';

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
      version: 2,
      // migrate the pre-refactor shape (heroStyle/itemStyle/bigger) to the
      // new portraitType/itemStyle/size model.
      migrate: (persisted, from) => {
        const state = persisted as { board?: Record<string, unknown> };
        if (from >= 2 || !state?.board) return persisted as unknown as { board: Board };
        const b = state.board as Record<string, unknown> & { categories?: Record<string, unknown>[] };
        const itemMap = (v: unknown) => (v === 4 ? 1 : 0); // old 3=items,4=badges
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
        return { board: b as unknown as Board };
      },
    },
  ),
);
