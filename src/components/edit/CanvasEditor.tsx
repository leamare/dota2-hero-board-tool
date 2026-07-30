import { useState } from 'react';
import type { CSSProperties } from 'react';
import CanvasBoard from '../board/CanvasBoard';
import CategoryLabel from '../board/CategoryLabel';
import ElementPortrait from '../board/ElementPortrait';
import { useCanvasDrag, HANDLES } from './useCanvasDrag';
import { useBoardStore } from '../../state/boardStore';
import { canvasBounds } from '../../lib/canvas';
import { colorIndex, LABEL_COLORS } from '../../lib/constants';
import type { Board } from '../../types/board';

interface Props {
  board: Board;
  onOpenSettings: (catId: string) => void;
  onAdd: (catId: string) => void;
}

const HEADER_SIZE_CLASS = ['hs-small', 'hs-normal', 'hs-large', 'hs-huge'];

/**
 * Canvas mode in the edit tab: cards can be dragged anywhere and resized from
 * eight handles. Positions live in the board as percentages of the canvas width.
 */
export default function CanvasEditor({ board, onOpenSettings, onAdd }: Props) {
  const setCategoryRect = useBoardStore((s) => s.setCategoryRect);
  const removeCategory = useBoardStore((s) => s.removeCategory);
  const removeElement = useBoardStore((s) => s.removeElement);
  const [selected, setSelected] = useState<string | null>(null);
  const [unit, setUnit] = useState(0);

  const { onPointerDown, onPointerMove, endDrag, activeId } = useCanvasDrag({
    unit,
    onChange: setCategoryRect,
  });

  const bounds = canvasBounds(board.categories);

  return (
    <div
      className={activeId ? 'canvas-dragging' : undefined}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={(e) => {
        // clicking the empty canvas clears the selection
        if ((e.target as HTMLElement).classList.contains('canvas-content')) setSelected(null);
      }}
    >
      <CanvasBoard
        board={board}
        onMeasure={setUnit}
        renderCard={({ category, rect, style, portraitPx }) => {
          const classes = [
            'category',
            'canvas-card',
            category.color ? 'has-color' : '',
            selected === category.id ? 'selected' : '',
            activeId === category.id ? 'dragging' : '',
            HEADER_SIZE_CLASS[category.headerSize ?? 1],
          ]
            .filter(Boolean)
            .join(' ');

          // the colour variable the card styles read (CategoryCard sets this
          // on the read-only path; canvas cards build their own markup)
          const colorVar = category.color
            ? `var(--label-${LABEL_COLORS[colorIndex(category.color)].key})`
            : undefined;

          return (
            <div
              key={category.id}
              className={classes}
              style={
                {
                  ...style,
                  position: 'absolute',
                  ...(colorVar ? { '--cat-color': colorVar } : {}),
                } as CSSProperties
              }
              onPointerDown={() => setSelected(category.id)}
            >
              <div className="cat-head">
                <button
                  className="drag-handle"
                  title="Drag to move"
                  onPointerDown={onPointerDown(category.id, rect, '')}
                >
                  ⠿
                </button>
                <span className={`cat-title${category.preset === undefined && !category.text?.trim() && !category.icon ? ' empty' : ''}`}>
                  <CategoryLabel category={category} />
                </span>
                <span className="cat-controls">
                  <button className="btn small" title="Settings" onClick={() => onOpenSettings(category.id)}>
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
                {category.elements.map((el, i) => (
                  <div
                    className={`portrait-slot${el.kind === 'break' ? ' break-slot' : ''}`}
                    key={i}
                  >
                    <ElementPortrait
                      element={el}
                      category={category}
                      board={board}
                      sizePx={portraitPx}
                    />
                    <button
                      className="portrait-remove"
                      title="Remove"
                      onClick={() => removeElement(category.id, i)}
                    />
                  </div>
                ))}
                <button
                  className="portrait add-tile"
                  title="Add hero or item"
                  style={{ width: portraitPx, height: portraitPx }}
                  onClick={() => onAdd(category.id)}
                >
                  +
                </button>
              </div>

              {HANDLES.map((h) => (
                <span
                  key={h}
                  className={`canvas-handle ${h}`}
                  onPointerDown={onPointerDown(category.id, rect, h)}
                />
              ))}
            </div>
          );
        }}
      />
      <p className="muted canvas-hint">
        Drag cards to move them, use the handles to resize. Hold <b>Alt</b> to snap to a grid.
        Canvas is {Math.round(bounds.w)}% × {Math.round(bounds.h)}% of its width.
      </p>
    </div>
  );
}
