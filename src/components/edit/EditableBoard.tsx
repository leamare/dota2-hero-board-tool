import { Fragment, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableCategory, { categoryDragId } from './SortableCategory';
import Picker from './Picker';
import CategorySettingsModal from './CategorySettingsModal';
import AltIconModal from './AltIconModal';
import { useBoardStore } from '../../state/boardStore';
import { categoryBasis, groupCategories, resolveDisplay } from '../../lib/board';

/** Parse an element drag id "el:<catId>:<index>". */
function parseElId(id: string): { catId: string; index: number } | null {
  if (!id.startsWith('el:')) return null;
  const rest = id.slice(3);
  const sep = rest.lastIndexOf(':');
  return { catId: rest.slice(0, sep), index: Number(rest.slice(sep + 1)) };
}

export default function EditableBoard() {
  const board = useBoardStore((s) => s.board);
  const addElement = useBoardStore((s) => s.addElement);
  const reorderCategories = useBoardStore((s) => s.reorderCategories);
  const reorderElements = useBoardStore((s) => s.reorderElements);
  const moveElement = useBoardStore((s) => s.moveElement);

  const [pickerCat, setPickerCat] = useState<string | null>(null);
  const [settingsCat, setSettingsCat] = useState<string | null>(null);
  const [altTarget, setAltTarget] = useState<{ catId: string; index: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // reorder categories
    if (activeId.startsWith('cat:') && overId.startsWith('cat:')) {
      const ids = board.categories.map((c) => c.id);
      const from = ids.indexOf(activeId.slice(4));
      const to = ids.indexOf(overId.slice(4));
      if (from >= 0 && to >= 0) reorderCategories(arrayMove(ids, from, to));
      return;
    }

    // move elements
    const src = parseElId(activeId);
    if (!src) return;
    const dst = parseElId(overId);
    if (dst) {
      if (src.catId === dst.catId) {
        const cat = board.categories.find((c) => c.id === src.catId);
        if (!cat) return;
        const order = cat.elements.map((_, i) => i);
        reorderElements(src.catId, arrayMove(order, src.index, dst.index));
      } else {
        moveElement(src.catId, src.index, dst.catId, dst.index);
      }
    } else if (overId.startsWith('cat:')) {
      // dropped onto a category's empty space → append there
      const toCat = overId.slice(4);
      if (toCat !== src.catId) {
        const target = board.categories.find((c) => c.id === toCat);
        moveElement(src.catId, src.index, toCat, target?.elements.length ?? 0);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        className={[
          'board',
          board.centered ? 'centered' : '',
          board.darkenedBg ? 'darkened' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <SortableContext
          items={board.categories.map((c) => categoryDragId(c.id))}
          strategy={rectSortingStrategy}
        >
          {groupCategories(board.categories).map((group) => {
            const first = group[0];
            const last = group[group.length - 1];
            const basis = categoryBasis(first, board);
            const renderCat = (cat: (typeof group)[number], grouped: boolean) => (
              <SortableCategory
                key={cat.id}
                category={cat}
                board={board}
                grouped={grouped}
                onOpenSettings={() => setSettingsCat(cat.id)}
                onAdd={() => setPickerCat(cat.id)}
                onElementAlt={(index) => setAltTarget({ catId: cat.id, index })}
              />
            );
            return (
              <Fragment key={first.id}>
                {first.newRow && <div className="row-break" />}
                {group.length === 1 ? (
                  renderCat(first, false)
                ) : (
                  <div
                    className="category-group"
                    style={
                      { '--cat-basis': `calc(${basis}% - var(--grid-gap))` } as React.CSSProperties
                    }
                  >
                    {group.map((c) => renderCat(c, true))}
                  </div>
                )}
                {last.separatorAfter && <div className="separator" />}
              </Fragment>
            );
          })}
        </SortableContext>
      </div>

      <Picker
        open={pickerCat !== null}
        keepOpen
        previewType={
          pickerCat
            ? resolveDisplay(
                board.categories.find((c) => c.id === pickerCat) ?? board.categories[0],
                board,
              ).type
            : board.portraitType
        }
        onClose={() => setPickerCat(null)}
        onPick={(el) => pickerCat && addElement(pickerCat, el)}
      />
      <CategorySettingsModal categoryId={settingsCat} onClose={() => setSettingsCat(null)} />
      <AltIconModal target={altTarget} onClose={() => setAltTarget(null)} />
    </DndContext>
  );
}
