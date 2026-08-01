import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore } from '../state/layoutsStore';
import { useUiStore } from '../state/uiStore';
import { useIsMobile } from './useIsMobile';

/**
 * Load a saved grid onto the board. Shared by the sidebar list and the
 * grid-switching hotkeys so both keep the same rules: switching while you were
 * editing keeps you in the editor, and an unpinned sidebar closes behind you.
 */
export function useLoadLayout(): (id: string) => void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  return useCallback(
    (id: string) => {
      const layout = useLayoutsStore.getState().layouts.find((l) => l.id === id);
      if (!layout) return;
      const ui = useUiStore.getState();
      useBoardStore.getState().setBoard({ ...layout.board }, layout.id);
      const editing =
        pathname.startsWith('/edit') ||
        (!pathname.startsWith('/view') && ui.lastBoardTab === 'edit');
      navigate(editing ? '/edit' : '/view');
      if (!(ui.sidebarPinned && !isMobile)) ui.setOpen(false);
    },
    [navigate, pathname, isMobile],
  );
}
