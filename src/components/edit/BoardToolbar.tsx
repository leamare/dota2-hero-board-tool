import { useBoardStore } from '../../state/boardStore';
import { COLUMN_OPTIONS } from '../../lib/constants';
import { stylesForKind } from '../../lib/images';

export default function BoardToolbar() {
  const board = useBoardStore((s) => s.board);
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const addCategory = useBoardStore((s) => s.addCategory);
  const resetBoard = useBoardStore((s) => s.resetBoard);

  return (
    <div className="toolbar">
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
        <label htmlFor="board-hero-style">Hero style</label>
        <select
          id="board-hero-style"
          className="select"
          value={board.heroStyle}
          onChange={(e) => patchBoard({ heroStyle: Number(e.target.value) })}
        >
          {stylesForKind('hero').map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field row">
        <label htmlFor="board-item-style">Item style</label>
        <select
          id="board-item-style"
          className="select"
          value={board.itemStyle}
          onChange={(e) => patchBoard({ itemStyle: Number(e.target.value) })}
        >
          {stylesForKind('item').map((s) => (
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
      <button
        className="btn danger"
        onClick={() => {
          if (confirm('Clear the whole board?')) resetBoard();
        }}
      >
        Clear
      </button>
    </div>
  );
}
