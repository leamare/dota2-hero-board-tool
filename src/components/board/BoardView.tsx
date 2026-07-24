import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { Board } from '../../types/board';
import { groupCategories, unitSpan } from '../../lib/board';
import CategoryCard from './CategoryCard';
import { useT } from '../../lib/i18n';

/**
 * Read-only board renderer. A CSS grid keeps rows aligned; categories span
 * columns by width, and linked categories render together as one unit.
 */
export default function BoardView({ board }: { board: Board }) {
  const t = useT();
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
          </Fragment>
        );
      })}
      {board.categories.length === 0 && (
        <div className="board-empty">{t('view.empty')}</div>
      )}
    </div>
  );
}
