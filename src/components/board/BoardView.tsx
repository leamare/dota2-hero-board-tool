import type { CSSProperties } from 'react';
import type { Board } from '../../types/board';
import { boardLayout } from '../../lib/layout';
import CategoryCard from './CategoryCard';
import { useT } from '../../lib/i18n';

/**
 * Read-only board renderer. A CSS grid keeps rows and columns aligned; each
 * category occupies its own cell at the position resolved by the layout
 * engine (chains place members in adjacent columns / stacked rows).
 */
export default function BoardView({ board }: { board: Board }) {
  const t = useT();
  const layout = boardLayout(board);
  const byId = new Map(board.categories.map((c) => [c.id, c]));

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
      {layout.map((p) => {
        const category = byId.get(p.id);
        if (!category) return null;
        const cell: CSSProperties = {
          gridColumn: `${p.col + 1} / span ${p.colSpan}`,
          gridRow: p.row + 1,
        };
        return <CategoryCard key={p.id} category={category} board={board} style={cell} />;
      })}
      {board.categories.length === 0 && <div className="board-empty">{t('view.empty')}</div>}
    </div>
  );
}
