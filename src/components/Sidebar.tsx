import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore } from '../state/layoutsStore';
import { useToast } from '../state/ToastProvider';
import { COLUMN_OPTIONS } from '../lib/constants';
import { emptyBoard } from '../lib/board';

/** Slide-out sidebar: navigate between saved grids and tweak display settings. */
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const setCurrentLayoutId = useBoardStore((s) => s.setCurrentLayoutId);

  const { layouts, save, overwrite, remove } = useLayoutsStore();

  const loadLayout = (id: string) => {
    const l = layouts.find((x) => x.id === id);
    if (!l) return;
    setBoard({ ...l.board }, l.id);
    navigate('/view');
    setOpen(false);
  };

  const newGrid = () => {
    setBoard(emptyBoard(), null);
    navigate('/edit');
    setOpen(false);
  };

  const saveCurrent = () => {
    const current = layouts.find((l) => l.id === currentLayoutId);
    if (current) {
      overwrite(current.id, board);
      toast(`Saved "${current.name}"`);
    } else {
      const name = prompt('Save grid as:', board.name) ?? '';
      if (!name.trim()) return;
      setCurrentLayoutId(save(name.trim(), board));
      toast(`Saved "${name.trim()}"`);
    }
  };

  return (
    <>
      <button
        className={`sidebar-tab${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Grids & settings"
        aria-label="Grids and settings"
      >
        {open ? '‹' : '›'}
      </button>

      <div className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-section">
          <h3>Grids</h3>
          <div className="sidebar-actions">
            <button className="btn small primary" onClick={newGrid}>
              ＋ New
            </button>
            <button className="btn small" onClick={saveCurrent}>
              Save current
            </button>
          </div>
          <ul className="sidebar-grids">
            {layouts.length === 0 && <li className="muted">No saved grids yet.</li>}
            {layouts.map((l) => (
              <li key={l.id} className={l.id === currentLayoutId ? 'active' : undefined}>
                <button className="sidebar-grid-name" onClick={() => loadLayout(l.id)}>
                  {l.board.icon && <span className="grid-icon">{l.board.icon}</span>}
                  {l.name}
                </button>
                <button
                  className="sidebar-grid-del"
                  title="Delete"
                  onClick={() => confirm(`Delete "${l.name}"?`) && remove(l.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Display</h3>
          <div className="field row">
            <label htmlFor="sb-cols">Columns</label>
            <select
              id="sb-cols"
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
        </div>
      </div>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}
