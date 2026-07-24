import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../state/boardStore';
import { useLayoutsStore } from '../../state/layoutsStore';
import { useToast } from '../../state/ToastProvider';

const AUTOSAVE_KEY = 'hgt.autosave';

export default function SaveControls() {
  const board = useBoardStore((s) => s.board);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const setCurrentLayoutId = useBoardStore((s) => s.setCurrentLayoutId);
  const { layouts, save, overwrite } = useLayoutsStore();
  const toast = useToast();

  // autosave defaults on (only '0' disables it)
  const [autosave, setAutosave] = useState(() => localStorage.getItem(AUTOSAVE_KEY) !== '0');
  const firstRun = useRef(true);

  const current = layouts.find((l) => l.id === currentLayoutId) ?? null;

  const saveNew = () => {
    const name = prompt('Save grid as:', board.name) ?? '';
    if (!name.trim()) return;
    const id = save(name.trim(), board);
    setCurrentLayoutId(id);
    toast(`Saved "${name.trim()}"`);
  };

  const saveNow = (silent = false) => {
    if (current) {
      overwrite(current.id, board);
      if (!silent) toast(`Saved "${current.name}"`);
      else toast('Autosaved', 'info');
    } else if (!silent) {
      saveNew();
    }
  };

  // autosave: persist to the tracked layout shortly after any change
  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0');
  }, [autosave]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!autosave || !currentLayoutId) return;
    const t = setTimeout(() => saveNow(true), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, autosave, currentLayoutId]);

  return (
    <span className="save-controls">
      <button className="btn primary" onClick={() => saveNow(false)} title="Save to the current grid">
        {current ? 'Save' : 'Save grid'}
      </button>
      <button className="btn" onClick={saveNew} title="Save as a new grid">
        Save as…
      </button>
      <label className="checkbox">
        <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
        Autosave
      </label>
      {current && <span className="muted">→ {current.name}</span>}
    </span>
  );
}
