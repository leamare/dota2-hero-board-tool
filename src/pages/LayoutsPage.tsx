import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../state/layoutsStore';

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LayoutsPage() {
  const navigate = useNavigate();
  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const { layouts, save, overwrite, remove, rename, importLayouts } = useLayoutsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const saveCurrent = () => {
    const name = prompt('Save current grid as:', board.name) ?? '';
    if (name.trim()) save(name.trim(), board);
  };

  const load = (l: SavedLayout) => {
    setBoard({ ...l.board, name: l.board.name }, l.id);
    navigate('/view');
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const list: SavedLayout[] = Array.isArray(parsed) ? parsed : [parsed];
      importLayouts(list.filter((l) => l && l.board));
    } catch {
      alert('Could not read that file.');
    }
  };

  return (
    <div className="layouts-page">
      <div className="toolbar">
        <button className="btn primary" onClick={saveCurrent}>
          Save current grid
        </button>
        <div className="sep" />
        <button className="btn" onClick={() => download('hero-grids.json', layouts)}>
          Export all
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {layouts.length === 0 ? (
        <p className="board-empty">No saved grids yet. Save the current one to get started.</p>
      ) : (
        <ul className="layouts-list">
          {layouts.map((l) => (
            <li key={l.id} className="layout-row">
              <span className="layout-name">{l.name}</span>
              <span className="layout-meta">{l.board.categories.length} categories</span>
              <span className="layout-actions">
                <button className="btn small primary" onClick={() => load(l)}>
                  Load
                </button>
                <button className="btn small" onClick={() => overwrite(l.id, board)}>
                  Update
                </button>
                <button
                  className="btn small"
                  onClick={() => {
                    const n = prompt('Rename to:', l.name);
                    if (n?.trim()) rename(l.id, n.trim());
                  }}
                >
                  Rename
                </button>
                <button className="btn small" onClick={() => download(`${l.name}.json`, l)}>
                  Export
                </button>
                <button
                  className="btn small danger"
                  onClick={() => confirm(`Delete "${l.name}"?`) && remove(l.id)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
