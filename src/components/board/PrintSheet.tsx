import { useLocation } from 'react-router-dom';
import BoardView from './BoardView';
import BoardImageHead from './BoardImageHead';
import QRCode from '../ui/QRCode';
import { buildShareUrl } from '../../lib/shareUrl';
import { useBoardStore } from '../../state/boardStore';

/** Widest the printed sheet gets — the same width as the PNG export. */
export const PRINT_SHEET_MAX = 1600;
/** Roughly the width one column needs to look comfortable. */
const PER_COLUMN = 400;

/**
 * Sheet width for a grid. Fixed per column count rather than per window, so the
 * printed layout is the same for everyone; a one-column tier list gets a narrow
 * sheet, which in turn lets the page come out portrait.
 */
export const printSheetWidth = (columns: number): number =>
  Math.max(800, Math.min(PRINT_SHEET_MAX, columns * PER_COLUMN));

/**
 * A print-only copy of the grid, laid out the way the shareable image is:
 * the banner (name, author, description, QR) over the board at the grid's own
 * column count.
 *
 * Printing this instead of scaling the live page is what makes the output
 * predictable — the on-screen board reflows with the window and collapses its
 * columns when the browser narrows the viewport to the paper, which is exactly
 * what the printer would otherwise capture.
 */
export default function PrintSheet() {
  const board = useBoardStore((s) => s.board);
  const { pathname } = useLocation();

  // only the board tabs have a grid to print
  if (!pathname.startsWith('/view') && !pathname.startsWith('/edit')) return null;

  return (
    <div className="print-sheet-root" aria-hidden="true">
      <div className="print-sheet" style={{ width: board.canvas ? PRINT_SHEET_MAX : printSheetWidth(board.columns) }}>
        <BoardImageHead
          board={board}
          qr={<QRCode text={buildShareUrl(board)} scale={3} minSize={0} />}
        />
        <BoardView board={board} columns={board.columns} />
      </div>
    </div>
  );
}
