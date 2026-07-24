import { useState } from 'react';
import { useBoardStore } from '../../state/boardStore';
import { COLUMN_OPTIONS, GRID_ICONS } from '../../lib/constants';
import { ITEM_STYLES, PORTRAIT_TYPES, SIZES } from '../../lib/images';
import ShareModal from './ShareModal';
import SaveControls from './SaveControls';

export default function BoardToolbar() {
  const board = useBoardStore((s) => s.board);
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const addCategory = useBoardStore((s) => s.addCategory);
  const resetBoard = useBoardStore((s) => s.resetBoard);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="toolbar">
      <div className="field row">
        <label htmlFor="board-icon">Icon</label>
        <select
          id="board-icon"
          className="select grid-icon-select"
          value={board.icon ?? ''}
          onChange={(e) => patchBoard({ icon: e.target.value })}
        >
          {GRID_ICONS.map((g) => (
            <option key={g} value={g}>
              {g || '—'}
            </option>
          ))}
        </select>
      </div>

      <div className="field row">
        <label htmlFor="board-name">Name</label>
        <input
          id="board-name"
          className="input"
          value={board.name}
          onChange={(e) => patchBoard({ name: e.target.value })}
        />
      </div>

      <div className="field row">
        <label htmlFor="board-cols">Columns</label>
        <select
          id="board-cols"
          className="select"
          value={board.columns}
          onChange={(e) => patchBoard({ columns: Number(e.target.value) })}
        >
          {COLUMN_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="field row">
        <label htmlFor="board-type">Portraits</label>
        <select
          id="board-type"
          className="select"
          value={board.portraitType}
          onChange={(e) => patchBoard({ portraitType: Number(e.target.value) })}
        >
          {PORTRAIT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field row">
        <label htmlFor="board-size">Size</label>
        <select
          id="board-size"
          className="select"
          value={board.size}
          onChange={(e) => patchBoard({ size: Number(e.target.value) })}
        >
          {SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field row">
        <label htmlFor="board-item">Items</label>
        <select
          id="board-item"
          className="select"
          value={board.itemStyle}
          onChange={(e) => patchBoard({ itemStyle: Number(e.target.value) })}
        >
          {ITEM_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sep" />

      <label className="checkbox">
        <input
          type="checkbox"
          checked={board.colorfulLabels}
          onChange={(e) => patchBoard({ colorfulLabels: e.target.checked })}
        />
        Colourful labels
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={board.centered}
          onChange={(e) => patchBoard({ centered: e.target.checked })}
        />
        Centered
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={board.darkenedBg}
          onChange={(e) => patchBoard({ darkenedBg: e.target.checked })}
        />
        Darken
      </label>

      <div className="sep" />

      <button className="btn primary" onClick={addCategory}>
        + Category
      </button>
      <button className="btn" onClick={() => setShareOpen(true)}>
        Share
      </button>
      <button
        className="btn danger"
        onClick={() => {
          if (confirm('Clear the whole board?')) resetBoard();
        }}
      >
        Clear
      </button>

      <div className="sep" />
      <SaveControls />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
