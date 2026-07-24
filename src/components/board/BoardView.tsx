import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { Board } from '../../types/board';
import { categoryBasis, groupCategories } from '../../lib/board';
import CategoryCard from './CategoryCard';

/**
 * Read-only board renderer. Categories flow in a wrapping grid, honouring
 * width, connected groups, forced row breaks and separators.
 */
export default function BoardView({ board }: { board: Board }) {
  const groups = groupCategories(board.categories);

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
      {groups.map((group) => {
        const first = group[0];
        const last = group[group.length - 1];
        const basis = categoryBasis(first, board);
        const groupStyle = {
          '--cat-basis': `calc(${basis}% - var(--grid-gap))`,
        } as CSSProperties;

        return (
          <Fragment key={first.id}>
            {first.newRow && <div className="row-break" />}
            {group.length === 1 ? (
              <CategoryCard category={first} board={board} />
            ) : (
              <div className="category-group" style={groupStyle}>
                {group.map((c) => (
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
