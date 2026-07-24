import type { CSSProperties, ReactNode } from 'react';
import type { Board, Category } from '../../types/board';
import { colorIndex, LABEL_COLORS } from '../../lib/constants';
import CategoryLabel from './CategoryLabel';
import ElementPortrait from './ElementPortrait';

interface Props {
  category: Category;
  board: Board;
  /** when inside a link group the card fills its unit instead of a grid cell */
  grouped?: boolean;
  /** grid-cell style supplied by the board layout */
  style?: CSSProperties;
  headerControls?: ReactNode;
  dragHandle?: ReactNode;
  renderElementOverlay?: (index: number) => ReactNode;
  bodyExtra?: ReactNode;
}

const isEmptyLabel = (c: Category): boolean =>
  c.name.type === 'text' && !c.name.text?.trim();

const HEADER_SIZE_CLASS = ['hs-small', 'hs-normal', 'hs-large', 'hs-huge'];

export default function CategoryCard({
  category,
  board,
  grouped,
  style: cellStyle,
  headerControls,
  dragHandle,
  renderElementOverlay,
  bodyExtra,
}: Props) {
  const hasColor = !!category.color;
  const colorVar = hasColor
    ? `var(--label-${LABEL_COLORS[colorIndex(category.color)].key})`
    : undefined;

  const style: CSSProperties = {
    ...cellStyle,
    ...(colorVar ? { '--cat-color': colorVar } : {}),
  } as CSSProperties;

  return (
    <div
      className={[
        'category',
        grouped ? 'grouped' : '',
        hasColor ? 'has-color' : '',
        HEADER_SIZE_CLASS[category.headerSize ?? 1],
        category.separatorRight ? 'sep-right' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="cat-head">
        {dragHandle}
        <span className={`cat-title${isEmptyLabel(category) ? ' empty' : ''}`}>
          {isEmptyLabel(category) ? 'Untitled' : <CategoryLabel name={category.name} />}
        </span>
        {headerControls}
      </div>

      <div className={`cat-body${category.elements.length || bodyExtra ? '' : ' empty'}`}>
        {category.elements.length === 0 && !bodyExtra && <span>empty</span>}
        {category.elements.map((el, i) => (
          <div className="portrait-slot" key={i}>
            <ElementPortrait element={el} category={category} board={board} />
            {renderElementOverlay?.(i)}
          </div>
        ))}
        {bodyExtra}
      </div>
    </div>
  );
}
