import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Discrete UI scale steps, matching the pattern used by lm2_dashboard. */
export const UI_SCALE_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6];
const DEFAULT_SCALE = 1;

const nearestStep = (n: number): number =>
  UI_SCALE_STEPS.reduce((best, s) => (Math.abs(s - n) < Math.abs(best - n) ? s : best), 1);

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
    }),
    { name: 'hgt.ui' },
  ),
);
