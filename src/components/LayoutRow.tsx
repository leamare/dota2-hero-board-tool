import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import GridIcon from './GridIcon';
import { buildShareUrl } from '../lib/shareUrl';
import type { SavedLayout } from '../state/layoutsStore';

interface Props {
  layout: SavedLayout;
  actions: ReactNode;
  /** open this grid in the view tab */
  onOpen?: () => void;
}

/** A draggable row on the Layouts page (name + category count + action buttons). */
export default function LayoutRow({ layout, actions, onOpen }: Props) {
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
      {/* a real link — a plain click loads the grid and switches to the view tab,
          while opening it in a new tab follows its share link to the same grid */}
      <a
        className="layout-name"
        href={buildShareUrl(layout.board)}
        title={`Open "${layout.name}"`}
        onClick={(e) => {
          if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onOpen();
        }}
      >
        <GridIcon tag={layout.board.icon} />
        {layout.name}
      </a>
      <span className="layout-meta">{layout.board.categories.length} categories</span>
      <span className="layout-actions">{actions}</span>
    </li>
  );
}
