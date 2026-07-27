import { Fragment, useCallback, useRef, useState } from 'react';
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
  // the dragged card's starting rectangle, so bringing its ghost back over that
  // spot resets the preview to the original order (drop-in-place = no-op)
  const startRect = useRef<{ left: number; top: number; right: number; bottom: number } | null>(null);

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

  // Collision tuned for the variable-height, wrapping grid:
  //  - Exclude the dragged card itself. Droppables are measured live (Always),
  //    so the dragged card's rect tracks its ghost under the cursor; if it
  //    stayed a candidate it would always win and nothing else could target.
  //  - When dragging a category, only categories are valid targets. Otherwise
  //    the element droppables inside a populated card win pointerWithin (their
  //    centres are closer), so hovering a card's body wouldn't reorder — only
  //    its header would. Filtering them out makes the whole card a target.
  //  - pointerWithin (the card the cursor is inside) beats closestCenter, which
  //    measures distance to each card's centre and mis-targets tall cards.
  //  - closestCenter is the fallback for the gaps between cards.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const draggingCategory = String(args.active.id).startsWith('cat:');
    const containers = args.droppableContainers.filter((c) => {
      const cid = String(c.id);
      if (cid === String(args.active.id)) return false;
      return draggingCategory ? cid.startsWith('cat:') : true;
    });
    const filtered = { ...args, droppableContainers: containers };
    const hits = pointerWithin(filtered);
    return hits.length ? hits : closestCenter(filtered);
  }, []);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setOverId(null);
    setActiveSize(null);
    startRect.current = null;
  };

  // Sticky target: only advance to a real, different droppable. Never reset to
  // null in the gaps between cards — `over` briefly goes null there and on the
  // frame the ghost re-renders, and snapping the preview back to the original
  // order would flicker. Two exceptions reset to the original order on purpose:
  // dragging the ghost back over the card's own starting spot (drop-in-place).
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    // capture the start rect/size lazily: with Always measuring the initial
    // rect isn't ready in onDragStart, but it is by the first onDragOver
    const init = active.rect.current.initial;
    if (!startRect.current && init) {
      startRect.current = {
        left: init.left,
        top: init.top,
        right: init.left + init.width,
        bottom: init.top + init.height,
      };
      setActiveSize({ w: init.width, h: init.height });
    }
    const cur = active.rect.current.translated;
    const s = startRect.current;
    if (cur && s) {
      const cx = cur.left + cur.width / 2;
      const cy = cur.top + cur.height / 2;
      if (cx >= s.left && cx <= s.right && cy >= s.top && cy <= s.bottom) {
        setOverId(null); // back over the start → preview original, drop is a no-op
        return;
      }
    }
    if (over) setOverId(String(over.id));
  };

  const handleDragEnd = ({ active }: DragEndEvent) => {
    const aId = String(active.id);
    const target = overId; // the sticky preview target — drop matches what's shown
    setActiveId(null);
    setOverId(null);
    setActiveSize(null);
    if (!target || target === aId) return;

    // reorder categories
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
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
