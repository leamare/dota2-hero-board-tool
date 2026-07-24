import type { ReactNode } from 'react';
import type { Board, Category } from '../../types/board';
import { categoryBasis, effectiveStyle } from '../../lib/board';
import { colorIndex, LABEL_COLORS } from '../../lib/constants';
import CategoryLabel from './CategoryLabel';
import ElementPortrait from './ElementPortrait';

interface Props {
  category: Category;
  board: Board;
  /** optional controls rendered in the header (edit mode) */
  headerControls?: ReactNode;
  /** optional per-element overlay (edit mode) */
  renderElementOverlay?: (index: number) => ReactNode;
  bodyExtra?: ReactNode;
}

const isEmptyLabel = (c: Category): boolean =>
  c.name.type === 'text' && !c.name.text?.trim();

export default function CategoryCard({
  category,
  board,
  headerControls,
  renderElementOverlay,
  bodyExtra,
}: Props) {
  const basis = categoryBasis(category, board);
  const hasColor = board.colorfulLabels && !!category.color;
  const colorVar = hasColor
    ? `var(--label-${LABEL_COLORS[colorIndex(category.color)].key})`
    : undefined;

  return (
    <div
      className={[
        'category',
        category.bigger ? 'bigger' : '',
        hasColor ? 'has-color' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--cat-basis': `calc(${basis}% - var(--grid-gap))`,
          ...(colorVar ? { '--cat-color': colorVar } : {}),
        } as React.CSSProperties
      }
    >
      <div className="cat-head">
        <span className={`cat-title${isEmptyLabel(category) ? ' empty' : ''}`}>
          {isEmptyLabel(category) ? 'Untitled' : <CategoryLabel name={category.name} />}
        </span>
        {headerControls}
      </div>

      <div className={`cat-body${category.elements.length ? '' : ' empty'}`}>
        {category.elements.length === 0 && !bodyExtra && <span>empty</span>}
        {category.elements.map((el, i) => (
          <div className="portrait-slot" key={i}>
            <ElementPortrait element={el} styleId={effectiveStyle(el, category, board)} />
            {renderElementOverlay?.(i)}
          </div>
        ))}
        {bodyExtra}
      </div>
    </div>
  );
}
