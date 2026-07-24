import { Fragment } from 'react';
import type { Board } from '../../types/board';
import CategoryCard from './CategoryCard';

/**
 * Read-only board renderer. Lays out categories in a wrapping flow, honouring
 * per-category width, forced row breaks and dashed separators.
 */
export default function BoardView({ board }: { board: Board }) {
  return (
    <div
      className={[
        'board',
        board.centered ? 'centered' : '',
        board.darkenedBg ? 'darkened' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {board.categories.map((cat) => (
        <Fragment key={cat.id}>
          {cat.newRow && <div className="row-break" />}
          <CategoryCard category={cat} board={board} />
          {cat.separatorAfter && <div className="separator" />}
        </Fragment>
      ))}
      {board.categories.length === 0 && (
        <div className="board-empty">This grid is empty. Switch to Edit to add categories.</div>
      )}
    </div>
  );
}
