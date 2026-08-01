import { useLocation } from 'react-router-dom';
import BoardImageHead from './BoardImageHead';
import QRCode from '../ui/QRCode';
import { buildShareUrl } from '../../lib/shareUrl';
import { useBoardStore } from '../../state/boardStore';

/**
 * The shareable-image banner, printed above the board. Hidden on screen and
 * revealed by the `printing` class, so a printed grid carries its name, author,
 * description and a QR back to the editable version — same as the PNG export.
 */
export default function PrintBanner() {
  const board = useBoardStore((s) => s.board);
  const { pathname } = useLocation();

  // only the board tabs have something to brand
  if (!pathname.startsWith('/view') && !pathname.startsWith('/edit')) return null;

  return (
    <div className="print-banner" aria-hidden="true">
      <BoardImageHead board={board} qr={<QRCode text={buildShareUrl(board)} scale={3} minSize={0} />} />
    </div>
  );
}
