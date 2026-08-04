import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Discrete UI scale steps, matching the pattern used by lm2_dashboard. */
export const UI_SCALE_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6];
const DEFAULT_SCALE = 1;

const nearestStep = (n: number): number =>
  UI_SCALE_STEPS.reduce((best, s) => (Math.abs(s - n) < Math.abs(best - n) ? s : best), 1);

export type Theme = 'dark' | 'light';

interface UiStore {
  sidebarOpen: boolean;
  /** when pinned the sidebar stays open and pushes the page layout */
  sidebarPinned: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setPinned: (pinned: boolean) => void;

  /** zoom applied to the page content — bigger portraits/text without resizing chrome */
  uiScale: number;
  setUiScale: (scale: number) => void;
  bumpUiScale: (dir: 1 | -1) => void;

  /** app version whose what's-new dialog the user has already dismissed */
  lastSeenVersion: string | null;
  markVersionSeen: (version: string) => void;

  /** the board tab last visited, so loading a grid reopens where you were */
  lastBoardTab: 'view' | 'edit';
  setLastBoardTab: (tab: 'view' | 'edit') => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  /** Dota 2 account id the personalised grids are built for, remembered */
  accountId: string;
  setAccountId: (id: string) => void;

  /* --- transient, not persisted (see `partialize`) --- */

  /** the category hotkeys act on, shared by the classic and canvas editors */
  selectedCategoryId: string | null;
  setSelectedCategory: (id: string | null) => void;
  /**
   * Counters bumped by hotkeys to open a modal owned by another component.
   * The owner watches the value and opens on change — the modals live in
   * Sidebar and EditableBoard, which the hotkey handler can't reach directly.
   */
  openShareAt: number;
  requestShare: () => void;
  openCategorySettingsAt: number;
  requestCategorySettings: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      sidebarPinned: false,
      setOpen: (open) => set({ sidebarOpen: open }),
      toggleOpen: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      // pinning opens it; unpinning just drops the pin and leaves it open as a normal overlay
      setPinned: (pinned) =>
        set((s) => ({ sidebarPinned: pinned, sidebarOpen: pinned ? true : s.sidebarOpen })),

      uiScale: DEFAULT_SCALE,
      setUiScale: (scale) => set({ uiScale: nearestStep(scale) }),
      bumpUiScale: (dir) => {
        const idx = UI_SCALE_STEPS.indexOf(nearestStep(get().uiScale));
        const next = UI_SCALE_STEPS[Math.max(0, Math.min(UI_SCALE_STEPS.length - 1, idx + dir))];
        set({ uiScale: next });
      },

      lastSeenVersion: null,
      markVersionSeen: (version) => set({ lastSeenVersion: version }),

      lastBoardTab: 'view',
      setLastBoardTab: (tab) => set({ lastBoardTab: tab }),

      accountId: '',
      setAccountId: (accountId) => set({ accountId }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      selectedCategoryId: null,
      setSelectedCategory: (id) => set({ selectedCategoryId: id }),
      openShareAt: 0,
      requestShare: () => set((s) => ({ openShareAt: s.openShareAt + 1 })),
      openCategorySettingsAt: 0,
      requestCategorySettings: () =>
        set((s) => ({ openCategorySettingsAt: s.openCategorySettingsAt + 1 })),
    }),
    {
      name: 'hgt.ui',
      // selection and the modal-open counters are per-session UI state
      partialize: ({
        sidebarOpen,
        sidebarPinned,
        uiScale,
        lastSeenVersion,
        lastBoardTab,
        theme,
        accountId,
      }) => ({
        sidebarOpen,
        sidebarPinned,
        uiScale,
        lastSeenVersion,
        lastBoardTab,
        theme,
        accountId,
      }),
    },
  ),
);
