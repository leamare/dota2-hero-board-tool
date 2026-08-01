import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCodeLib from 'qrcode';
import Modal from '../ui/Modal';
import BoardView from './BoardView';
import BoardImageHead from './BoardImageHead';
import { buildShareUrl } from '../../lib/shareUrl';
import { downloadDataUrl } from '../../lib/gridFile';
import type { Board } from '../../types/board';

/** Fixed width of the exported image, so grids look the same for everyone. */
const IMAGE_WIDTH = 1600;

/**
 * QR size in image pixels. It is generated at exactly this size and never
 * scaled — resampling a QR blurs the modules and makes it unscannable.
 */
const QR_SIZE = 208;

/**
 * Stand-in for an image that won't load (a stale hero tag, a grid icon that no
 * longer exists). Without it a single 404 would reject the whole render.
 */
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface Props {
  open: boolean;
  onClose: () => void;
  board: Board;
}

/**
 * Renders the whole grid off-screen at a fixed width and rasterizes it to a PNG,
 * with a QR code linking back to the editable grid. Rendering the real board
 * markup keeps the image identical to the view tab.
 */
export default function ShareImageModal({ open, onClose, board }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);

  /*
   * Both results are tagged with the grid they belong to, and read back only
   * when that tag still matches. Plain state would leave the previous grid's
   * image on screen from the render that switches grids until an effect could
   * clear it — a wait, not a flash, because re-rendering the 1600px stage takes
   * a moment. The same tagging stops a stale QR kicking off a doomed render.
   */
  const [qrJob, setQrJob] = useState<{ url: string; qr: string } | null>(null);
  const [pngJob, setPngJob] = useState<{ url: string; png?: string; error?: string } | null>(null);

  const url = buildShareUrl(board);
  // null = still generating, '' = too much data for a QR (render without one)
  const qr = qrJob?.url === url ? qrJob.qr : null;
  const png = (pngJob?.url === url && pngJob.png) || '';
  const error = pngJob?.url === url ? pngJob.error : undefined;

  // the QR has to be a data URL before rasterizing, or it won't be in the PNG
  useEffect(() => {
    if (!open) return;
    let alive = true;
    // margin 2 keeps a quiet zone, which scanners need to find the code
    QRCodeLib.toDataURL(url, { width: QR_SIZE, margin: 2, errorCorrectionLevel: 'L' })
      .then((u) => alive && setQrJob({ url, qr: u }))
      // a huge grid can exceed the QR capacity — still export, just without one
      .catch(() => alive && setQrJob({ url, qr: '' }));
    return () => {
      alive = false;
    };
  }, [open, url]);

  // rasterize once the stage (and its QR) have painted
  useEffect(() => {
    if (!open || qr === null) return;
    let alive = true;
    const node = stageRef.current;
    if (!node) return;

    // every portrait must be decoded first, or it lands in the PNG as a gap
    const settled = Array.from(node.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          }),
    );

    Promise.all(settled)
      .then(() =>
        toPng(node, {
          width: IMAGE_WIDTH,
          pixelRatio: 1,
          cacheBust: true,
          imagePlaceholder: BLANK_PIXEL,
          backgroundColor: getComputedStyle(document.body).backgroundColor,
        }),
      )
      .then((data) => alive && setPngJob({ url, png: data }))
      .catch(
        () =>
          alive &&
          setPngJob({
            url,
            error: 'Could not render the image — some portraits may have failed to load.',
          }),
      );

    return () => {
      alive = false;
    };
    // `board` is not a dependency: its identity changes on unrelated store
    // writes, and `url` already changes whenever its contents do
  }, [open, qr, url]);

  const copyImage = async () => {
    try {
      const blob = await (await fetch(png)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      /* clipboard images aren't allowed everywhere — the download still works */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Grid image" width="52rem">
      {/* off-screen stage: real board markup at the export width */}
      {open && (
        <div className="image-stage-wrap" aria-hidden="true">
          <div className="board-image" ref={stageRef} style={{ width: IMAGE_WIDTH }}>
            <BoardImageHead
              board={board}
              qr={
                qr ? (
                  <img className="board-image-qr" src={qr} alt="" width={QR_SIZE} height={QR_SIZE} />
                ) : null
              }
            />

            <BoardView board={board} columns={board.columns} />
          </div>
        </div>
      )}

      {error ? (
        <p className="muted">{error}</p>
      ) : png ? (
        <>
          <img className="image-preview" src={png} alt="Grid preview" />
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => downloadDataUrl(board.name, png)}>
              Download PNG
            </button>
            <button className="btn" onClick={copyImage}>
              Copy image
            </button>
            <span className="muted" style={{ alignSelf: 'center' }}>
              {IMAGE_WIDTH}px wide
            </span>
          </div>
        </>
      ) : (
        <p className="muted">Rendering image…</p>
      )}
    </Modal>
  );
}
