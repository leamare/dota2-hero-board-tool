import { useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableCategory, { categoryDragId } from './SortableCategory';
import Picker from './Picker';
import CategorySettingsModal from './CategorySettingsModal';
import CanvasEditor from './CanvasEditor';
import AltIconModal from './AltIconModal';
import CategoryCard from '../board/CategoryCard';
import ElementPortrait from '../board/ElementPortrait';
import { useBoardStore } from '../../state/boardStore';
import { resolveDisplay } from '../../lib/board';
import { UNITS_PER_COLUMN, boardLayout, chainLinks } from '../../lib/layout';
import { useMaxColumns } from '../../lib/maxColumns';
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
    // second click of a pending link on the SAME axis completes/cancels it
    if (pendingLink && pendingLink.orient === orient) {
      if (pendingLink.catId === catId) setPendingLink(null); // cancel
      else {
        linkCategories(pendingLink.catId, catId, orient);
        setPendingLink(null);
      }
      return;
    }
    const cat = board.categories.find((c) => c.id === catId);
    const linked = orient === 'h' ? cat?.hGroup : cat?.vGroup;
    if (linked) unlinkCategory(catId, orient); // already in a chain on this axis → unlink
    else setPendingLink({ catId, orient });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Collision tuned for the variable-height grid:
  //  - When dragging a category, only categories are valid targets. Otherwise
  //    the element droppables inside a populated card win pointerWithin (their
  //    centres are closer), so hovering a card's body wouldn't reorder — only
  //    its header would. Filtering them out makes the whole card a target.
  //  - pointerWithin (the card the cursor is inside) beats closestCenter, which
  //    measures distance to each card's centre and mis-targets tall cards.
  //  - closestCenter is the fallback for the gaps between cards.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const draggingCategory = String(args.active.id).startsWith('cat:');
    const containers = draggingCategory
      ? args.droppableContainers.filter((c) => String(c.id).startsWith('cat:'))
      : args.droppableContainers;
    const filtered = { ...args, droppableContainers: containers };
    const hits = pointerWithin(filtered);
    return hits.length ? hits : closestCenter(filtered);
  }, []);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setOverId(null);
    const r = active.rect.current.initial;
    setActiveSize(r ? { w: r.width, h: r.height } : null);
  };

  // Sticky target: only advance to a real, different droppable. Never reset to
  // null — in the gaps between cards (and on the frame the ghost re-renders)
  // `over` briefly goes null, and snapping the preview back to the original
  // order there is exactly the flicker. Keep the last target until a new one.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return; // transient null over a gap → keep the last target
    const id = String(over.id);
    // hovering the dragged card's own slot is a deliberate "back to start" —
    // reset so the original order previews and a drop there is a no-op
    setOverId(id === String(active.id) ? null : id);
  };

  const handleDragEnd = ({ active }: DragEndEvent) => {
    const aId = String(active.id);
    const target = overId; // the sticky preview target — drop matches what's shown
    setActiveId(null);
    setOverId(null);
    setActiveSize(null);
    if (!target || target === aId) return;

    // reorder categories: move in the base list, the layout engine re-places
    if (aId.startsWith('cat:') && target.startsWith('cat:')) {
      const ids = board.categories.map((c) => c.id);
      const from = ids.indexOf(aId.slice(4));
      const to = ids.indexOf(target.slice(4));
      if (from >= 0 && to >= 0 && from !== to) reorderCategories(arrayMove(ids, from, to));
      return;
    }

    // move elements
    const src = parseElId(aId);
    if (!src) return;
    const dst = parseElId(target);
    if (dst) {
      if (src.catId === dst.catId) {
        const cat = board.categories.find((c) => c.id === src.catId);
        if (!cat) return;
        const order = cat.elements.map((_, i) => i);
        reorderElements(src.catId, arrayMove(order, src.index, dst.index));
      } else {
        moveElement(src.catId, src.index, dst.catId, dst.index);
      }
    } else if (target.startsWith('cat:')) {
      // dropped onto a category's empty space → append there
      const toCat = target.slice(4);
      if (toCat !== src.catId) {
        const toCategory = board.categories.find((c) => c.id === toCat);
        moveElement(src.catId, src.index, toCat, toCategory?.elements.length ?? 0);
      }
    }
  };

  // Live drop-location preview: while dragging a category, render the list in
  // the order it would land in, so the browser re-lays the variable-span grid
  // natively (the dragged card shows a ghost gap exactly where it'll go).
  // The droppable rects are frozen at drag start (measuring: BeforeDragging),
  // so this DOM reorder does NOT move them — closestCenter keeps colliding
  // against the original slots and can't feed back into itself and oscillate.
  const displayCategories = (() => {
    const cats = board.categories;
    if (!activeId?.startsWith('cat:') || !overId?.startsWith('cat:') || activeId === overId)
      return cats;
    const from = cats.findIndex((c) => categoryDragId(c.id) === activeId);
    const to = cats.findIndex((c) => categoryDragId(c.id) === overId);
    if (from < 0 || to < 0) return cats;
    return arrayMove(cats, from, to);
  })();
  const cols = Math.min(board.columns, useMaxColumns());
  const displayById = new Map(displayCategories.map((c) => [c.id, c]));
  const displayLayout = boardLayout({ ...board, categories: displayCategories }, cols);
  const displayLinks = chainLinks(displayCategories, displayLayout);

  // canvas mode places cards freely, so the sortable grid doesn't apply
  if (board.canvas) {
    return (
      <>
        <CanvasEditor board={board} onOpenSettings={setSettingsCat} onAdd={setPickerCat} />
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
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
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
          'edit',
          board.centered ? 'centered' : '',
          board.darkenedBg ? 'darken' : '',
          board.colorfulLabels ? 'full-labels' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--units': cols * UNITS_PER_COLUMN } as CSSProperties}
      >
        <SortableContext
          items={displayCategories.map((c) => categoryDragId(c.id))}
          strategy={rectSortingStrategy}
        >
          {displayLayout.map((p) => {
            const category = displayById.get(p.id);
            if (!category) return null;
            const cell: CSSProperties = {
              gridColumn: `${p.col + 1} / span ${p.colSpan}`,
              gridRow: p.row + 1,
            };
            return (
              <SortableCategory
                key={category.id}
                category={category}
                board={board}
                cellStyle={cell}
                chain={displayLinks.get(category.id)}
                linkPending={pendingLink?.catId === category.id}
                onOpenSettings={() => setSettingsCat(category.id)}
                onAdd={() => setPickerCat(category.id)}
                onElementAlt={(index) => setAltTarget({ catId: category.id, index })}
                onLink={(orient) => handleLink(category.id, orient)}
              />
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
        'edit',
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
