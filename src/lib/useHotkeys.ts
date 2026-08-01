import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore } from '../state/layoutsStore';
import { useUiStore } from '../state/uiStore';
import { useLoadLayout } from './useLoadLayout';

/** Shortcuts, as shown in About. All of them are Alt + something. */
export const HOTKEYS: { keys: string; action: string }[] = [
  { keys: 'Alt + ↑ / ↓', action: 'Previous / next saved grid' },
  { keys: 'Alt + A', action: 'Show or hide the sidebar' },
  { keys: 'Alt + ← / →', action: 'Select the previous / next category' },
  { keys: 'Alt + Q', action: 'Open the selected category’s settings' },
  { keys: 'Alt + E', action: 'Switch between the View and Edit tabs' },
  { keys: 'Alt + W', action: 'Share the current grid' },
];

/** Typing in a field beats any shortcut. */
const isTyping = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  );
};

/**
 * Global Alt-based shortcuts. Mounted once from Layout; the actions that open a
 * modal owned by another component go through the request counters in uiStore.
 */
export function useHotkeys(): void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loadLayout = useLoadLayout();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (isTyping(e.target)) return;

      const ui = useUiStore.getState();
      const { board, currentLayoutId } = useBoardStore.getState();
      const layouts = useLayoutsStore.getState().layouts;

      // step through the saved grids, starting at the top when none is tracked
      const stepGrid = (dir: 1 | -1) => {
        if (!layouts.length) return;
        const at = layouts.findIndex((l) => l.id === currentLayoutId);
        const next = at < 0 ? (dir === 1 ? 0 : layouts.length - 1) : (at + dir + layouts.length) % layouts.length;
        loadLayout(layouts[next].id);
      };

      // move the selection along the category list, wrapping at both ends
      const stepCategory = (dir: 1 | -1) => {
        const cats = board.categories;
        if (!cats.length) return;
        const at = cats.findIndex((c) => c.id === ui.selectedCategoryId);
        const next = at < 0 ? (dir === 1 ? 0 : cats.length - 1) : (at + dir + cats.length) % cats.length;
        const id = cats[next].id;
        ui.setSelectedCategory(id);
        document
          .querySelector(`[data-category-id="${id}"]`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };

      switch (e.key.toLowerCase()) {
        case 'arrowup':
          stepGrid(-1);
          break;
        case 'arrowdown':
          stepGrid(1);
          break;
        case 'arrowleft':
          stepCategory(-1);
          break;
        case 'arrowright':
          stepCategory(1);
          break;
        case 'a':
          ui.toggleOpen();
          break;
        case 'q': {
          // category settings only exist in the editor, so go there first
          const id = ui.selectedCategoryId ?? board.categories[0]?.id ?? null;
          if (!id) return;
          ui.setSelectedCategory(id);
          if (!pathname.startsWith('/edit')) navigate('/edit');
          ui.requestCategorySettings();
          break;
        }
        case 'e':
          navigate(pathname.startsWith('/edit') ? '/view' : '/edit');
          break;
        case 'w':
          ui.requestShare();
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, pathname, loadLayout]);
}
