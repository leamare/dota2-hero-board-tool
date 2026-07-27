import { Fragment, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableCategory, { categoryDragId } from './SortableCategory';
import Picker from './Picker';
import CategorySettingsModal from './CategorySettingsModal';
import AltIconModal from './AltIconModal';
import CategoryCard from '../board/CategoryCard';
import ElementPortrait from '../board/ElementPortrait';
import { useBoardStore } from '../../state/boardStore';
import { groupCategories, resolveDisplay, unitSpan } from '../../lib/board';
import type { Category } from '../../types/board';
import type { CSSProperties } from 'react';

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

  const linkCategories = useBoardStore((s) => s.linkCategories);
  const unlinkCategory = useBoardStore((s) => s.unlinkCategory);

  const [pickerCat, setPickerCat] = useState<string | null>(null);
  const [settingsCat, setSettingsCat] = useState<string | null>(null);
  const [altTarget, setAltTarget] = useState<{ catId: string; index: number } | null>(null);
  const [pendingLink, setPendingLink] = useState<{ catId: string; orient: 'v' | 'h' } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // the category currently under the cursor, for the live drop-location preview
  const [overId, setOverId] = useState<string | null>(null);
  // size of the dragged node, captured at lift-off, so the overlay matches the
  // source cell instead of collapsing to its natural (squished/stretched) size
  const [activeSize, setActiveSize] = useState<{ w: number; h: number } | null>(null);

  const handleLink = (catId: string, orient: 'v' | 'h') => {
    if (pendingLink) {
      if (pendingLink.catId === catId) {
        setPendingLink(null); // cancel
      } else {
        linkCategories(pendingLink.catId, catId, pendingLink.orient);
        setPendingLink(null);
      }
      return;
    }
    const cat = board.categories.find((c) => c.id === catId);
    if (cat?.linkGroup) unlinkCategory(catId);
    else setPendingLink({ catId, orient });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    const r = active.rect.current.initial;
    setActiveSize(r ? { w: r.width, h: r.height } : null);
  };

  const handleDragOver = ({ over }: DragOverEvent) =>
    setOverId(over ? String(over.id) : null);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    setActiveSize(null);
    if (!over || active.id === over.id) return;
    const aId = String(active.id);
    const overId = String(over.id);

    // reorder categories
    if (aId.startsWith('cat:') && overId.startsWith('cat:')) {
      const ids = board.categories.map((c) => c.id);
      const from = ids.indexOf(aId.slice(4));
      const to = ids.indexOf(overId.slice(4));
      if (from >= 0 && to >= 0) reorderCategories(arrayMove(ids, from, to));
      return;
    }

    // move elements
    const src = parseElId(aId);
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

  // live drop-location preview: while dragging a category, render the list in
  // the order it would land in. the browser re-lays the variable-span grid
  // natively, so the dragged card shows a ghost gap exactly where it'll go —
  // no rectSortingStrategy transforms (which broke on the non-uniform grid).
  const displayCategories = (() => {
    const cats = board.categories;
    if (!activeId?.startsWith('cat:') || !overId?.startsWith('cat:') || activeId === overId)
      return cats;
    const from = cats.findIndex((c) => categoryDragId(c.id) === activeId);
    const to = cats.findIndex((c) => categoryDragId(c.id) === overId);
    if (from < 0 || to < 0) return cats;
    return arrayMove(cats, from, to);
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverId(null);
        setActiveSize(null);
      }}
    >
      <div
        className={[
          'board',
          board.centered ? 'centered' : '',
          board.darkenedBg ? 'darken' : '',
          board.colorfulLabels ? 'full-labels' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--cols': board.columns } as CSSProperties}
      >
        <SortableContext
          items={displayCategories.map((c) => categoryDragId(c.id))}
          strategy={rectSortingStrategy}
        >
          {groupCategories(displayCategories).map((unit) => {
            const first = unit.categories[0];
            const span = unitSpan(unit, board);
            const cell: CSSProperties = {
              gridColumn: first.newRow ? `1 / span ${span}` : `span ${span}`,
            };
            const renderCat = (cat: Category, grouped: boolean, cs?: CSSProperties) => (
              <SortableCategory
                key={cat.id}
                category={cat}
                board={board}
                grouped={grouped}
                cellStyle={cs}
                linkPending={pendingLink?.catId === cat.id}
                onOpenSettings={() => setSettingsCat(cat.id)}
                onAdd={() => setPickerCat(cat.id)}
                onElementAlt={(index) => setAltTarget({ catId: cat.id, index })}
                onLink={(orient) => handleLink(cat.id, orient)}
              />
            );
            return (
              <Fragment key={unit.key}>
                {unit.orient === null ? (
                  renderCat(first, false, cell)
                ) : (
                  <div
                    className={`category-group ${unit.orient === 'h' ? 'horizontal' : ''}`}
                    style={cell}
                  >
                    {unit.categories.map((c) => renderCat(c, true))}
                  </div>
                )}
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

      <DragOverlay dropAnimation={null}>
        {activeId && renderDragOverlay(activeId)}
      </DragOverlay>
    </DndContext>
  );

  function renderDragOverlay(id: string) {
    if (id.startsWith('cat:')) {
      const cat = board.categories.find((c) => c.id === id.slice(4));
      if (!cat) return null;
      // the board-level classes carry the colour rules, so the dragged card
      // shows the same colours as it does in place
      const boardClasses = [
        'board',
        'drag-overlay-card',
        board.centered ? 'centered' : '',
        board.darkenedBg ? 'darken' : '',
        board.colorfulLabels ? 'full-labels' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return (
        <div
          className={boardClasses}
          style={activeSize ? { width: activeSize.w } : undefined}
        >
          <CategoryCard category={cat} board={board} />
        </div>
      );
    }
    const src = parseElId(id);
    if (src) {
      const cat = board.categories.find((c) => c.id === src.catId);
      const el = cat?.elements[src.index];
      if (cat && el) return <ElementPortrait element={el} category={cat} board={board} />;
    }
    return null;
  }
}
