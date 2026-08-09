import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, CanvasRect, Category, GridElement } from '../types/board';
import { emptyBoard, genId, newCategory } from '../lib/board';
import { autoLayout, seedRects, toClassic } from '../lib/canvas';
import type { ToCanvasOptions, ToClassicOptions } from '../lib/canvas';

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
  unlinkCategory: (id: string, orient: 'v' | 'h') => void;

  /** free placement on (seeding rects from the current grid) or off (to classic) */
  setCanvasMode: (on: boolean, opts?: ToCanvasOptions & ToClassicOptions) => void;
  setCategoryRect: (id: string, rect: CanvasRect) => void;
  /** tidy the canvas: drop overlaps, fill the width, keep the arrangement */
  applyAutoLayout: () => void;

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
          const key = orient === 'h' ? 'hGroup' : 'vGroup';
          const a = s.board.categories.find((c) => c.id === aId);
          const b = s.board.categories.find((c) => c.id === bId);
          if (!a || !b) return s;
          // join b's existing chain on this axis, else start a new one
          const existing = b[key];
          const group = existing ?? genId();
          const cats = s.board.categories.map((c) => {
            if (c.id === aId || c.id === bId || (existing && c[key] === existing))
              return { ...c, [key]: group };
            return c;
          });
          return { board: { ...s.board, categories: cats } };
        }),

      unlinkCategory: (id, orient) =>
        set((s) => {
          const key = orient === 'h' ? 'hGroup' : 'vGroup';
          const cat = s.board.categories.find((c) => c.id === id);
          const group = cat?.[key];
          if (!group) return s;
          let cats = s.board.categories.map((c) => (c.id === id ? { ...c, [key]: undefined } : c));
          // dissolve the chain if only one member is left
          if (cats.filter((c) => c[key] === group).length === 1)
            cats = cats.map((c) => (c[key] === group ? { ...c, [key]: undefined } : c));
          return { board: { ...s.board, categories: cats } };
        }),

      setCanvasMode: (on, opts = {}) =>
        set((s) => {
          if (on) {
            // seed from the current grid so nothing jumps on the way in, and
            // keep any rects the user already arranged
            const seeded = seedRects(s.board, opts);
            // chains are a grid concept; dropping them here keeps a later
            // conversion back from silently re-linking things
            const drop = opts.eraseChains !== false;
            return {
              board: {
                ...s.board,
                canvas: true,
                categories: s.board.categories.map((c) => ({
                  ...c,
                  rect: c.rect ?? seeded.get(c.id),
                  ...(drop ? { hGroup: undefined, vGroup: undefined } : {}),
                })),
              },
            };
          }
          // leaving canvas mode tidies the arrangement, folds it into the
          // classic settings (order, columns, widths, sizes), then drops the
          // rects — the grid is now the source of truth, so switching back
          // re-seeds cleanly from it instead of resurrecting a stale canvas.
          const tidied = autoLayout(s.board.categories);
          const withRects = {
            ...s.board,
            categories: s.board.categories.map((c) => ({ ...c, rect: tidied.get(c.id) ?? c.rect })),
          };
          const { columns, categories } = toClassic(withRects, opts);
          return {
            board: {
              ...withRects,
              canvas: false,
              columns,
              categories: categories.map(({ rect: _rect, ...c }) => c),
            },
          };
        }),

      setCategoryRect: (id, rect) =>
        set((s) => ({
          board: { ...s.board, categories: mapCategory(s.board, id, (c) => ({ ...c, rect })) },
        })),

      applyAutoLayout: () =>
        set((s) => {
          const tidied = autoLayout(s.board.categories);
          if (tidied.size === 0) return s;
          return {
            board: {
              ...s.board,
              categories: s.board.categories.map((c) => ({ ...c, rect: tidied.get(c.id) ?? c.rect })),
            },
          };
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
      version: 6,
      migrate: (persisted, from) => {
        // every branch below only rewrites `board` — the rest of the persisted
        // state (currentLayoutId) has to survive untouched, or a migration
        // silently unlinks the open board from its saved grid: the next Save
        // then creates a new entry instead of updating the old one, leaving a
        // stale name sitting in the grids list
        const state = persisted as { board?: Record<string, unknown>; currentLayoutId?: string | null };
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

        // v3 -> v4: category.name -> text/preset + icon
        if (from < 4) {
          for (const c of (b.categories ?? []) as Record<string, unknown>[]) {
            const name = c.name as Record<string, unknown> | undefined;
            delete c.name;
            if (!name) continue;
            if (name.type === 'preset') c.preset = name.preset;
            else if (name.type === 'text') c.text = name.text ?? '';
            else if (name.type === 'hero' || name.type === 'item') {
              c.icon = {
                kind: name.type,
                refId: name.refId,
                iconType: name.iconType,
                alticon: name.alticon,
              };
            } else if (name.type === 'icon') {
              c.icon = { kind: 'facet', folder: name.iconFolder, tag: name.iconTag };
            }
          }
        }

        // v4 -> v5: single linkGroup/linkOrient -> independent hGroup/vGroup
        if (from < 5) {
          for (const c of (b.categories ?? []) as Record<string, unknown>[]) {
            if (c.linkGroup) {
              if (c.linkOrient === 'h') c.hGroup = c.linkGroup;
              else c.vGroup = c.linkGroup;
            }
            delete c.linkGroup;
            delete c.linkOrient;
          }
        }

        return { ...state, board: b as unknown as Board };
      },
    },
  ),
);
