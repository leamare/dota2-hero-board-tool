import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { Board } from '../../types/board';
import { groupCategories, unitSpan } from '../../lib/board';
import CategoryCard from './CategoryCard';

/**
 * Read-only board renderer. A CSS grid keeps rows aligned; categories span
 * columns by width, and linked categories render together as one unit.
 */
export default function BoardView({ board }: { board: Board }) {
  const units = groupCategories(board.categories);

  return (
    <div
      className={[
        'board',
        board.centered ? 'centered' : '',
        board.darkenedBg ? 'darken' : '',
        board.colorfulLabels ? 'full-labels' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--cols': board.columns } as CSSProperties}
    >
      {units.map((unit) => {
        const first = unit.categories[0];
        const last = unit.categories[unit.categories.length - 1];
        const span = unitSpan(unit, board);
        const cell: CSSProperties = {
          gridColumn: first.newRow ? `1 / span ${span}` : `span ${span}`,
        };

        return (
          <Fragment key={unit.key}>
            {unit.orient === null ? (
              <CategoryCard category={first} board={board} style={cell} />
            ) : (
              <div className={`category-group ${unit.orient === 'h' ? 'horizontal' : ''}`} style={cell}>
                {unit.categories.map((c) => (
                  <CategoryCard key={c.id} category={c} board={board} grouped />
                ))}
              </div>
            )}
            {last.separatorAfter && <div className="separator" />}
          </Fragment>
        );
      })}
      {board.categories.length === 0 && (
        <div className="board-empty">This grid is empty. Switch to Edit to add categories.</div>
      )}
    </div>
  );
}
