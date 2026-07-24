import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiStore {
  sidebarOpen: boolean;
  /** when pinned the sidebar stays open and pushes the page layout */
  sidebarPinned: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setPinned: (pinned: boolean) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarPinned: false,
      setOpen: (open) => set({ sidebarOpen: open }),
      toggleOpen: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setPinned: (pinned) => set({ sidebarPinned: pinned, sidebarOpen: pinned ? true : false }),
    }),
    { name: 'hgt.ui' },
  ),
);
