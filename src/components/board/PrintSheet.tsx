import { useLocation } from 'react-router-dom';
import BoardView from './BoardView';
import BoardImageHead from './BoardImageHead';
import QRCode from '../ui/QRCode';
import { buildShareUrl } from '../../lib/shareUrl';
import { useBoardStore } from '../../state/boardStore';

/**
 * A print-only copy of the grid, laid out the way the shareable image is: the
 * banner (name, author, description, QR) over the board at the grid's own
 * column count.
 *
 * Printing this instead of the live page is what makes the output predictable —
 * the on-screen board reflows with the window and collapses its columns when
 * the browser narrows the viewport to the paper, which is exactly what the
 * printer would otherwise capture. The width comes from the print stylesheet
 * (and, while measuring, from usePrintMode); nothing here is window-dependent.
 */
export default function PrintSheet() {
  const board = useBoardStore((s) => s.board);
  const { pathname } = useLocation();

  // only the board tabs have a grid to print
  if (!pathname.startsWith('/view') && !pathname.startsWith('/edit')) return null;

  return (
    <div className="print-sheet-root" aria-hidden="true">
      <div className="print-sheet">
        <BoardImageHead
          board={board}
          qr={<QRCode text={buildShareUrl(board)} scale={3} minSize={0} />}
        />
        <BoardView board={board} columns={board.columns} />
      </div>
    </div>
  );
}
