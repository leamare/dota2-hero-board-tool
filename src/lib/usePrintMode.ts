import { useEffect } from 'react';
import { useUiStore } from '../state/uiStore';

/**
 * Height/width of the tightest paper anyone is likely to use, landscape: A4's
 * content box at 10mm margins. Content shaped to fit this also fits Letter, and
 * fits either of them in portrait (where the width is the binding constraint).
 */
const TARGET_ASPECT = 190 / 277;

/** Sheet widths to try, narrowest first. Wider = fewer rows = shorter. */
const SHEET_WIDTHS = [1000, 1200, 1400, 1600, 1900, 2200, 2600, 3000];

/**
 * Reshape the page for printing, in place — there is no print route.
 *
 * `beforeprint` swaps the app chrome for the hidden print sheet (a copy of the
 * grid, see PrintSheet), goes light, and picks the sheet width whose
 * proportions fit on a page. `afterprint` puts it back.
 *
 * The sheet is *not* scaled here. The paper is unknowable until the print
 * layout runs: assuming A4 and forcing `@page size` to match makes Chrome tile
 * the page across several sheets when the dialog is set to anything else, and
 * assuming its pixel size makes the grid come out too small or too large.
 * Instead the sheet is sized in `vw` by the print stylesheet — which resolves
 * against the real page — and this hook only publishes the ratio the root
 * font-size must scale by to match: `--print-root`, a plain number so `calc()`
 * can multiply a `vw` by it.
 */
export function usePrintMode(): void {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const sheet = () => document.querySelector<HTMLElement>('.print-sheet');

    const before = () => {
      // chrome can fire this more than once per job; only the first pass measures
      if (document.body.classList.contains('printing')) return;
      const el = sheet();
      if (!el) return;

      root.dataset.theme = 'light';
      document.body.classList.add('printing');

      // the sheet only has a layout once `printing` reveals it
      const rootPx = parseFloat(getComputedStyle(root).fontSize) || 16;
      let width = SHEET_WIDTHS[SHEET_WIDTHS.length - 1];
      for (const candidate of SHEET_WIDTHS) {
        el.style.width = `${candidate}px`;
        if (el.scrollHeight / candidate <= TARGET_ASPECT) {
          width = candidate;
          break;
        }
      }
      el.style.width = '';

      // printing renders the sheet at 100vw, so every rem inside it has to
      // scale by the same ratio for the layout to come out identical
      root.style.setProperty('--print-root', String(rootPx / width));
    };

    const after = () => {
      root.dataset.theme = theme;
      root.style.removeProperty('--print-root');
      document.body.classList.remove('printing');
      const el = sheet();
      if (el) el.style.width = '';
    };

    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [theme]);
}
