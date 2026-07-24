import { useSortable } from '@dnd-kit/sortable';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import type { Board, Category } from '../../types/board';
import { categoryBasis } from '../../lib/board';
import { colorIndex, LABEL_COLORS } from '../../lib/constants';
import CategoryLabel from '../board/CategoryLabel';
import SortableElement, { elementDragId } from './SortableElement';
import { useBoardStore } from '../../state/boardStore';

interface Props {
  category: Category;
  board: Board;
  onOpenSettings: () => void;
  onAdd: () => void;
  onElementAlt: (index: number) => void;
}

export const categoryDragId = (id: string) => `cat:${id}`;

const isEmptyLabel = (c: Category): boolean =>
  c.name.type === 'text' && !c.name.text?.trim();

export default function SortableCategory({
  category,
  board,
  onOpenSettings,
  onAdd,
  onElementAlt,
}: Props) {
  const removeCategory = useBoardStore((s) => s.removeCategory);
  const removeElement = useBoardStore((s) => s.removeElement);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: categoryDragId(category.id) });

  const basis = categoryBasis(category, board);
  const hasColor = board.colorfulLabels && !!category.color;
  const colorVar = hasColor
    ? `var(--label-${LABEL_COLORS[colorIndex(category.color)].key})`
    : undefined;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    '--cat-basis': `calc(${basis}% - var(--grid-gap))`,
    ...(colorVar ? { '--cat-color': colorVar } : {}),
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 5 : undefined,
  } as CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'category',
        category.bigger ? 'bigger' : '',
        hasColor ? 'has-color' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="cat-head">
        <button className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </button>
        <span className={`cat-title${isEmptyLabel(category) ? ' empty' : ''}`}>
          {isEmptyLabel(category) ? 'Untitled' : <CategoryLabel name={category.name} />}
        </span>
        <span className="cat-controls">
          <button className="btn small" title="Settings" onClick={onOpenSettings}>
            ⚙
          </button>
          <button
            className="btn small danger"
            title="Delete category"
            onClick={() => removeCategory(category.id)}
          >
            ✕
          </button>
        </span>
      </div>

      <div className={`cat-body${category.elements.length ? '' : ' empty'}`}>
        <SortableContext
          items={category.elements.map((_, i) => elementDragId(category.id, i))}
          strategy={rectSortingStrategy}
        >
          {category.elements.map((_, i) => (
            <SortableElement
              key={elementDragId(category.id, i)}
              category={category}
              board={board}
              index={i}
              onRemove={() => removeElement(category.id, i)}
              onAlt={() => onElementAlt(i)}
            />
          ))}
        </SortableContext>
        <button className="portrait add-tile" title="Add hero or item" onClick={onAdd}>
          +
        </button>
      </div>
    </div>
  );
}
