import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BoardView from '../components/board/BoardView';
import BoardImageHead from '../components/board/BoardImageHead';
import QRCode from '../components/ui/QRCode';
import { buildShareUrl } from '../lib/shareUrl';
import { useBoardStore } from '../state/boardStore';
import { useMetadataState } from '../state/MetadataProvider';
import { useT } from '../lib/i18n';

/**
 * A print-ready rendering of the current grid: the shareable-image banner over
 * the board, on the light theme, with no app chrome. The whole thing is scaled
 * down until it fits one printed page.
 */
export default function PrintPage() {
  const board = useBoardStore((s) => s.board);
  const { data, error } = useMetadataState();
  const t = useT();

  // hides the app chrome; the light palette is forced by Layout, which owns the
  // theme attribute and would otherwise overwrite it on every render
  useEffect(() => {
    document.body.classList.add('printing');
    return () => document.body.classList.remove('printing');
  }, []);

  // shrink to a single page: the probe reports the printable box in px, and the
  // sheet is the paper itself, so both axes have to fit
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, w: 0, h: 0 });

  useLayoutEffect(() => {
    const content = contentRef.current;
    const probe = probeRef.current;
    if (!content || !probe) return;
    const recompute = () => {
      const page = probe.getBoundingClientRect();
      // measure unscaled, or the previous scale feeds back into the next one
      const w = content.scrollWidth;
      const h = content.scrollHeight;
      if (!w || !h || !page.width || !page.height) return;
      setFit({ scale: Math.min(1, page.width / w, page.height / h), w, h });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(content);
    // portraits arrive late and change the height, so re-fit as they land
    const imgs = Array.from(content.querySelectorAll('img'));
    imgs.forEach((img) => img.addEventListener('load', recompute));
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener('load', recompute));
      window.removeEventListener('resize', recompute);
    };
  }, [board, data]);

  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;

  return (
    <div className="print-page">
      {/* sized in mm, so it measures the real printable box in css pixels */}
      <div className="print-probe" ref={probeRef} aria-hidden="true" />

      <div className="print-controls">
        <button className="btn primary" onClick={() => window.print()}>
          {t('print.printBtn')}
        </button>
        <Link className="btn" to="/view">
          {t('print.back')}
        </Link>
        <span className="muted">{t('print.hint')}</span>
      </div>

      {/*
        a transform doesn't shrink the layout box, so the sheet is given the
        scaled size explicitly — otherwise the printer paginates the full-size
        box and a fitted grid still spills onto extra pages
      */}
      <div
        className="print-sheet"
        ref={sheetRef}
        style={fit.h ? { width: fit.w * fit.scale, height: fit.h * fit.scale } : undefined}
      >
        <div
          className="print-content"
          ref={contentRef}
          style={{ transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}
        >
          <BoardImageHead board={board} qr={<QRCode text={buildShareUrl(board)} scale={3} minSize={0} />} />
          <BoardView board={board} columns={board.columns} />
        </div>
      </div>
    </div>
  );
}
