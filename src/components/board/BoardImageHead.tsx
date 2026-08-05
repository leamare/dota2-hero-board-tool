import type { ReactNode } from 'react';
import GridIcon from '../GridIcon';
import { siteBaseLabel } from '../../lib/shareUrl';
import { useT } from '../../lib/i18n';
import type { Board } from '../../types/board';

interface Props {
  board: Board;
  /** the QR image, however the caller chose to build it (data URL, component) */
  qr?: ReactNode;
}

/**
 * The banner above an exported grid: icon, name, author, description, and a QR
 * linking back to the editable version. Shared by the PNG export and the print
 * page so the two look the same.
 */
export default function BoardImageHead({ board, qr }: Props) {
  const t = useT();
  return (
    <div className="board-image-head">
      <div className="board-image-titles">
        <h2 className="board-image-name">
          <GridIcon tag={board.icon} />
          {board.name}
        </h2>
        {board.author && <div className="board-image-author">{t('common.byAuthor').replace('{name}', board.author)}</div>}
        {board.description && <p className="board-image-desc">{board.description}</p>}
      </div>
      <div className="board-image-brand">
        {qr}
        <div className="board-image-credit">
          <b>Dota 2 Hero Grid Tool</b>
          <span>{siteBaseLabel()}</span>
          <span className="muted">{t('ui.scanToOpen')}</span>
        </div>
      </div>
    </div>
  );
}
