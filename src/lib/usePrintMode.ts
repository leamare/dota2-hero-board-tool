import { useEffect } from 'react';
import { useUiStore } from '../state/uiStore';

/**
 * Reshape the live page for printing, in place.
 *
 * The browser's own Ctrl+P is what triggers this — there is no separate print
 * route. On `beforeprint` the page is switched to the light palette, given the
 * `printing` class (which hides the app chrome and reveals the export banner),
 * and scaled down until the board fits one sheet; `afterprint` puts everything
 * back.
 *
 * The class is deliberately not an `@media print` rule: Chrome fires
 * `beforeprint` *before* print styles apply, so measuring would otherwise see
 * the on-screen layout — chrome visible, banner hidden — and compute the wrong
 * scale.
 */
export function usePrintMode(): void {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const main = () => document.querySelector<HTMLElement>('.app-main');
    const inner = () => document.querySelector<HTMLElement>('.print-scale');
    const probe = () => document.querySelector<HTMLElement>('.print-probe');

    /*
     * The width the board is currently laid out for, tracked live.
     *
     * The browser narrows the viewport to the paper before printing, which
     * would re-run the column-fit observer and make the board taller *after*
     * the fit has been measured — one sheet's worth of content spilling onto
     * three. Pinning the printed box back to this width keeps the column count
     * (and therefore the height) exactly what was on screen.
     */
    let laidOutAt = main()?.clientWidth ?? 0;
    const track = new ResizeObserver(() => {
      if (!document.body.classList.contains('printing')) {
        laidOutAt = main()?.clientWidth ?? laidOutAt;
      }
    });
    const el0 = main();
    if (el0) track.observe(el0);

    const before = () => {
      // chrome fires `beforeprint` *and* flips the print media query, so this
      // runs twice per job. the second pass would measure an already-hidden
      // probe, get a zero page box and collapse the board to nothing.
      if (document.body.classList.contains('printing')) return;
      const el = main();
      const scaled = inner();
      const box = probe();
      if (!el || !scaled || !box || !box.offsetWidth || !box.offsetHeight) return;
      // mm are absolute, so the page box reads the same before the switch —
      // and the probe is hidden once `printing` is on
      const pageW = box.offsetWidth;
      const pageH = box.offsetHeight;

      root.dataset.theme = 'light';
      /*
       * The root font-size is a viewport-relative formula, and print media
       * resolves it differently (16px instead of whatever the window gives),
       * which would inflate every rem in the board *after* it has been
       * measured. Freeze it at the on-screen value so the printed layout is
       * the one that was fitted.
       */
      root.style.fontSize = getComputedStyle(root).fontSize;
      document.body.classList.add('printing');

      // scale the on-screen layout rather than reflowing it to page width —
      // what you see is what comes out, just smaller
      scaled.style.transform = '';
      el.style.height = '';
      const w = laidOutAt || el.scrollWidth;
      // the inner box keeps the on-screen width so nothing reflows
      scaled.style.width = `${w}px`;
      el.style.width = `${w}px`;
      const h = scaled.scrollHeight;
      const scale = Math.min(1, pageW / Math.max(1, w), pageH / Math.max(1, h));

      // the transform shrinks what is painted but not the layout box, so the
      // inner element is scaled and `main` — untransformed — is pinned to the
      // result. that pinned box is what the printer paginates.
      scaled.style.transform = `scale(${scale})`;
      scaled.style.transformOrigin = 'top left';
      // the outer box takes the *scaled* size. leaving it at full width would
      // make the document wider than the paper, and chrome would shrink the
      // whole page to fit — scaling everything a second time.
      el.style.width = `${w * scale}px`;
      el.style.height = `${h * scale}px`;
    };

    const after = () => {
      const el = main();
      const scaled = inner();
      root.dataset.theme = theme;
      root.style.fontSize = '';
      document.body.classList.remove('printing');
      if (el) {
        el.style.width = '';
        el.style.height = '';
      }
      if (scaled) {
        scaled.style.width = '';
        scaled.style.transform = '';
        scaled.style.transformOrigin = '';
      }
    };

    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    // safari and older webkit only expose the print state as a media query
    const mq = window.matchMedia?.('print');
    const onMedia = (e: MediaQueryListEvent) => (e.matches ? before() : after());
    mq?.addEventListener?.('change', onMedia);

    return () => {
      track.disconnect();
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      mq?.removeEventListener?.('change', onMedia);
    };
  }, [theme]);
}
