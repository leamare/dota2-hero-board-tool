import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ElementPortrait from '../board/ElementPortrait';
import type { Board, Category } from '../../types/board';
import { effectiveStyle } from '../../lib/board';

interface Props {
  category: Category;
  board: Board;
  index: number;
  onRemove: () => void;
}

export const elementDragId = (catId: string, index: number) => `el:${catId}:${index}`;

export default function SortableElement({ category, board, index, onRemove }: Props) {
  const el = category.elements[index];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: elementDragId(category.id, index) });

  return (
    <div
      ref={setNodeRef}
      className={`portrait-slot${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <ElementPortrait element={el} styleId={effectiveStyle(el, category, board)} />
      <button
        className="portrait-remove"
        title="Remove"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      />
    </div>
  );
}
