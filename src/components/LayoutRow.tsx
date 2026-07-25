import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import GridIcon from './GridIcon';
import type { SavedLayout } from '../state/layoutsStore';

interface Props {
  layout: SavedLayout;
  actions: ReactNode;
}

/** A draggable row on the Layouts page (name + category count + action buttons). */
export default function LayoutRow({ layout, actions }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layout.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="layout-row">
      <button className="sidebar-grid-drag" title="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </button>
      <span className="layout-name">
        <GridIcon tag={layout.board.icon} />
        {layout.name}
      </span>
      <span className="layout-meta">{layout.board.categories.length} categories</span>
      <span className="layout-actions">{actions}</span>
    </li>
  );
}
