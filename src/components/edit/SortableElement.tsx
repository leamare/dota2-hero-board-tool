import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ElementPortrait from '../board/ElementPortrait';
import type { Board, Category } from '../../types/board';
import { useMetadata } from '../../state/MetadataProvider';

interface Props {
  category: Category;
  board: Board;
  index: number;
  onRemove: () => void;
  onAlt: () => void;
}

export const elementDragId = (catId: string, index: number) => `el:${catId}:${index}`;

export default function SortableElement({ category, board, index, onRemove, onAlt }: Props) {
  const el = category.elements[index];
  const meta = useMetadata();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: elementDragId(category.id, index), animateLayoutChanges: () => false });

  const hasAlticons =
    el.kind === 'hero' && (meta?.heroById.get(el.refId ?? -1)?.alticons.length ?? 0) > 0;

  return (
    <div
      ref={setNodeRef}
      className={`portrait-slot${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <ElementPortrait element={el} category={category} board={board} />
      {hasAlticons && (
        <button
          className="portrait-alt"
          title="Change portrait variant"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onAlt}
        >
          ★
        </button>
      )}
      <button
        className="portrait-remove"
        title="Remove"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      />
    </div>
  );
}
