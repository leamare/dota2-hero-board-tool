import { useState } from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { CSSProperties } from 'react';
import type { Board, Category, GridElement } from '../../types/board';
import { resolveDisplay } from '../../lib/board';
import { colorIndex, LABEL_COLORS } from '../../lib/constants';
import CategoryLabel from '../board/CategoryLabel';
import SortableElement, { elementDragId } from './SortableElement';
import { useBoardStore } from '../../state/boardStore';
import { PALETTE_MIME } from '../../lib/dnd';

interface Props {
  category: Category;
  board: Board;
  grouped?: boolean;
  cellStyle?: CSSProperties;
  linkPending?: boolean;
  onOpenSettings: () => void;
  onAdd: () => void;
  onElementAlt: (index: number) => void;
  onLink: (orient: 'v' | 'h') => void;
}

export const categoryDragId = (id: string) => `cat:${id}`;

const isEmptyLabel = (c: Category): boolean =>
  c.preset === undefined && !c.text?.trim() && !c.icon;

const HEADER_SIZE_CLASS = ['hs-small', 'hs-normal', 'hs-large', 'hs-huge'];

export default function SortableCategory({
  category,
  board,
  grouped,
  cellStyle,
  linkPending,
  onOpenSettings,
  onAdd,
  onElementAlt,
  onLink,
}: Props) {
  const removeCategory = useBoardStore((s) => s.removeCategory);
  const removeElement = useBoardStore((s) => s.removeElement);
  const addElement = useBoardStore((s) => s.addElement);
  const [dropActive, setDropActive] = useState(false);

  // accept icons dragged in from the sidebar palette
  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(PALETTE_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dropActive) setDropActive(true);
  };
  const onDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData(PALETTE_MIME);
    setDropActive(false);
    if (!raw) return;
    e.preventDefault();
    try {
      addElement(category.id, JSON.parse(raw) as GridElement);
    } catch {
      /* malformed payload — ignore */
    }
  };

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: categoryDragId(category.id),
    animateLayoutChanges: () => false,
  });

  const { aspect, heightRem } = resolveDisplay(category, board);
  const hasColor = !!category.color;
  const linked = !!category.linkGroup;
  const colorVar = hasColor
    ? `var(--label-${LABEL_COLORS[colorIndex(category.color)].key})`
    : undefined;

  const style: CSSProperties = {
    ...cellStyle,
    // no sortable transform: the board is a variable-span CSS grid, so live
    // sibling shifting overlaps/hides cards. the DragOverlay shows the dragged
    // card following the cursor; the source just dims and holds its place, and
    // the drop lands via collision detection.
    ...(colorVar ? { '--cat-color': colorVar } : {}),
    opacity: isDragging ? 0.35 : undefined,
  } as CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'category',
        grouped ? 'grouped' : '',
        hasColor ? 'has-color' : '',
        linkPending ? 'link-pending' : '',
        dropActive ? 'drop-active' : '',
        HEADER_SIZE_CLASS[category.headerSize ?? 1],
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={onDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
    >
      <div className="cat-head">
        <button className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </button>
        <span className={`cat-title${isEmptyLabel(category) ? ' empty' : ''}`}>
          {isEmptyLabel(category) ? 'Untitled' : <CategoryLabel category={category} />}
        </span>
        <span className="cat-controls">
          <button
            className={`btn small${linkPending ? ' primary' : ''}${linked ? ' active' : ''}`}
            title={linked ? 'Unlink' : 'Link vertically'}
            onClick={() => onLink('v')}
          >
            {linked ? '⛓' : '↕'}
          </button>
          {!linked && (
            <button
              className={`btn small${linkPending ? ' primary' : ''}`}
              title="Link horizontally"
              onClick={() => onLink('h')}
            >
              ↔
            </button>
          )}
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
        <button
          className="portrait add-tile"
          title="Add hero or item"
          style={{ aspectRatio: aspect, height: `${heightRem}rem` }}
          onClick={onAdd}
        >
          +
        </button>
      </div>
    </div>
  );
}
