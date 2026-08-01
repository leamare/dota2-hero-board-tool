import { useEffect } from 'react';
import { useUiStore } from '../state/uiStore';

/** A4 minus 10mm margins on every side, in millimetres. */
const PAGE_MM = { long: 297 - 20, short: 210 - 20 };

/** Never blow the sheet up beyond this, however small the grid is. */
const MAX_ZOOM = 3;

/** Injected at print time so the sheet orientation can follow the grid. */
const PAGE_STYLE_ID = 'print-page-size';

const setPageSize = (orientation: 'portrait' | 'landscape'): void => {
  let el = document.getElementById(PAGE_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = PAGE_STYLE_ID;
    document.head.append(el);
  }
  el.textContent = `@page { size: A4 ${orientation}; margin: 10mm; }`;
};

/**
 * Reshape the page for printing, in place — there is no print route.
 *
 * On `beforeprint` the app chrome is swapped for the hidden print sheet (a
 * fixed-width copy of the grid, see PrintSheet), the palette goes light, the
 * orientation is picked to suit the grid's shape, and the sheet is scaled to
 * fill one page. `afterprint` puts it all back.
 *
 * Everything keys off a class rather than `@media print`, because Chrome fires
 * `beforeprint` *before* print styles apply — a media query would leave the
 * measurements below reading the on-screen layout.
 */
export function usePrintMode(): void {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const sheet = () => document.querySelector<HTMLElement>('.print-sheet');
    const probe = () => document.querySelector<HTMLElement>('.print-probe');

    const before = () => {
      // chrome fires `beforeprint` *and* flips the print media query, so this
      // runs twice per job; only the first pass may measure
      if (document.body.classList.contains('printing')) return;
      const el = sheet();
      const ruler = probe();
      if (!el || !ruler || !ruler.offsetWidth) return;

      // the probe is a known number of millimetres wide, which gives this
      // document's px-per-mm; the page box follows from that
      const perMm = ruler.offsetWidth / PAGE_MM.long;

      /*
       * The root font-size is a viewport-relative formula behind an
       * `@media screen` query, so print media falls back to 16px and every rem
       * in the sheet would inflate after being measured. Freeze it.
       */
      root.style.fontSize = getComputedStyle(root).fontSize;
      root.dataset.theme = 'light';
      document.body.classList.add('printing');

      const w = el.offsetWidth;
      const h = el.scrollHeight;

      /*
       * Pick the orientation, allowing the sheet to grow past 1:1 — it is a
       * fixed-width layout, so a small grid should fill the page rather than
       * sit in a corner of it.
       *
       * Orientation is scored on how much of the page *width* the grid ends up
       * using, not on the raw scale: a one-column tier list fits marginally
       * bigger across a landscape page but leaves a third of it blank down the
       * side, where in portrait it spans edge to edge. Ties (both fill the
       * width) go to whichever comes out larger.
       */
      const fit = (pw: number, ph: number) => {
        const zoom = Math.min(MAX_ZOOM, (pw * perMm) / Math.max(1, w), (ph * perMm) / Math.max(1, h));
        return { zoom, cover: (w * zoom) / (pw * perMm) };
      };
      const landscape = fit(PAGE_MM.long, PAGE_MM.short);
      const portrait = fit(PAGE_MM.short, PAGE_MM.long);
      const tied = Math.abs(landscape.cover - portrait.cover) < 0.01;
      const useLandscape = tied
        ? landscape.zoom >= portrait.zoom
        : landscape.cover > portrait.cover;
      const scale = useLandscape ? landscape.zoom : portrait.zoom;
      setPageSize(useLandscape ? 'landscape' : 'portrait');

      /*
       * `zoom`, not `transform: scale()`. A transform shrinks what is painted
       * but leaves the layout box full size, so the printer keeps paginating
       * the unscaled height and trails empty sheets behind the grid — clipping
       * it away only works in some engines. Zoom resizes the box itself.
       */
      el.style.zoom = String(scale);
    };

    const after = () => {
      const el = sheet();
      root.dataset.theme = theme;
      root.style.fontSize = '';
      document.body.classList.remove('printing');
      if (el) el.style.zoom = '';
    };

    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    // safari and older webkit only expose the print state as a media query
    const mq = window.matchMedia?.('print');
    const onMedia = (e: MediaQueryListEvent) => (e.matches ? before() : after());
    mq?.addEventListener?.('change', onMedia);

    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      mq?.removeEventListener?.('change', onMedia);
    };
  }, [theme]);
}
