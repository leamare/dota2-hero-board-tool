import type { CSSProperties } from 'react';
import type { Board } from '../../types/board';
import { UNITS_PER_COLUMN, boardLayout, chainLinks } from '../../lib/layout';
import { useMaxColumns } from '../../lib/maxColumns';
import { useBoardMetrics } from '../../lib/useBoardMetrics';
import CanvasBoard from './CanvasBoard';
import CategoryCard from './CategoryCard';
import { useT } from '../../lib/i18n';

/**
 * Read-only board renderer. A CSS grid keeps rows and columns aligned; each
 * category occupies its own cell at the position resolved by the layout
 * engine (chains place members in adjacent columns / stacked rows).
 */
interface Props {
  board: Board;
  /** force a column count, ignoring what fits on screen (used by image export) */
  columns?: number;
}

export default function BoardView({ board, columns }: Props) {
  const t = useT();
  const fitted = useMaxColumns();
  const [boardRef, metrics] = useBoardMetrics();
  const cols = columns ?? Math.min(board.columns, fitted);

  // canvas grids carry their own positions; the column count doesn't apply
  if (board.canvas) return <CanvasBoard board={board} />;
  const layout = boardLayout(board, cols, metrics ?? undefined);
  const links = chainLinks(board.categories, layout);
  const byId = new Map(board.categories.map((c) => [c.id, c]));

  return (
    <div
      ref={boardRef}
      className={[
        'board',
        board.centered ? 'centered' : '',
        board.darkenedBg ? 'darken' : '',
        board.colorfulLabels ? 'full-labels' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--units': cols * UNITS_PER_COLUMN } as CSSProperties}
    >
      {layout.map((p) => {
        const category = byId.get(p.id);
        if (!category) return null;
        const cell: CSSProperties = {
          gridColumn: `${p.col + 1} / span ${p.colSpan}`,
          gridRow: p.row + 1,
        };
        return (
          <CategoryCard
            key={p.id}
            category={category}
            board={board}
            style={cell}
            chain={links.get(p.id)}
          />
        );
      })}
      {board.categories.length === 0 && <div className="board-empty">{t('view.empty')}</div>}
    </div>
  );
}
