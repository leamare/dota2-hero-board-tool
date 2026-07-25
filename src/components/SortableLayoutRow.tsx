import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import GridIcon from './GridIcon';
import type { SavedLayout } from '../state/layoutsStore';

interface Props {
  layout: SavedLayout;
  active: boolean;
  onLoad: () => void;
  onDelete: () => void;
}

/** One draggable row in a saved-layouts list (sidebar or Layouts page). */
export default function SortableLayoutRow({ layout, active, onLoad, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layout.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className={active ? 'active' : undefined}>
      <button className="sidebar-grid-drag" title="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </button>
      <button className="sidebar-grid-name" onClick={onLoad}>
        <GridIcon tag={layout.board.icon} />
        {layout.name}
      </button>
      <button className="sidebar-grid-del" title="Delete" onClick={onDelete}>
        ✕
      </button>
    </li>
  );
}
