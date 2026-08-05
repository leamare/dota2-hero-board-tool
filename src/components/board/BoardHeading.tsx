import type { ReactNode } from 'react';
import { useT } from '../../lib/i18n';
import type { Board } from '../../types/board';
import GridIcon from '../GridIcon';

interface Props {
  board: Board;
  /** shown when the grid has no name yet (edit tab) */
  fallbackName?: string;
  /** buttons for the right-hand side of the header */
  actions?: ReactNode;
}

/**
 * The grid's heading — icon, name, and the optional author and description —
 * shared by the view and edit tabs so both match the exported image.
 */
export default function BoardHeading({ board, fallbackName, actions }: Props) {
  const t = useT();
  return (
    <div className={`view-head${board.centered ? ' centered' : ''}`}>
      <div className="board-titles">
        <h1 className="board-name">
          <GridIcon tag={board.icon} />
          {board.name || fallbackName}
        </h1>
        {board.author && <div className="board-author">{t('common.byAuthor').replace('{name}', board.author)}</div>}
        {board.description && <p className="board-desc">{board.description}</p>}
      </div>
      {actions && <div className="view-actions">{actions}</div>}
    </div>
  );
}
