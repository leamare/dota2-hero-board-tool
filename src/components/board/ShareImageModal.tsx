import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCodeLib from 'qrcode';
import Modal from '../ui/Modal';
import BoardView from './BoardView';
import GridIcon from '../GridIcon';
import { buildShareUrl } from '../../lib/shareUrl';
import { downloadDataUrl } from '../../lib/gridFile';
import { PARENT_URL } from '../../lib/config';
import type { Board } from '../../types/board';

/** Fixed width of the exported image, so grids look the same for everyone. */
const IMAGE_WIDTH = 1400;

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
  const [qr, setQr] = useState('');
  const [png, setPng] = useState('');
  const [error, setError] = useState<string | null>(null);

  const url = buildShareUrl(board);

  // the QR has to be a data URL before rasterizing, or it won't be in the PNG
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setPng('');
    setError(null);
    QRCodeLib.toDataURL(url, { width: 320, margin: 1, errorCorrectionLevel: 'L' })
      .then((u) => alive && setQr(u))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
  }, [open, url]);

  // rasterize once the stage (and its QR) have painted
  useEffect(() => {
    if (!open || !qr) return;
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
      .then((data) => alive && setPng(data))
      .catch(
        () =>
          alive && setError('Could not render the image — some portraits may have failed to load.'),
      );

    return () => {
      alive = false;
    };
  }, [open, qr, board]);

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
            <div className="board-image-head">
              <h2 className="board-image-name">
                <GridIcon tag={board.icon} />
                {board.name}
              </h2>
              {board.author && <span className="board-image-author">by {board.author}</span>}
            </div>

            <BoardView board={board} columns={board.columns} />

            <div className="board-image-foot">
              {qr && <img className="board-image-qr" src={qr} alt="" width={110} height={110} />}
              <div className="board-image-credit">
                <b>Dota 2 Hero Grid Tool</b>
                <span>{PARENT_URL.replace(/^https?:\/\//, '')}/herogrid</span>
                <span className="muted">Scan to open this grid</span>
              </div>
            </div>
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
