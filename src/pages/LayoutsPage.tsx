import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GridIcon from '../components/GridIcon';
import Modal from '../components/ui/Modal';
import QRCode from '../components/ui/QRCode';
import QrScanner from '../components/ui/QrScanner';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../state/layoutsStore';
import { useToast } from '../state/ToastProvider';
import { decodeLayouts, layoutsShareUrl } from '../lib/layoutsShare';

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
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const { layouts, save, overwrite, remove, rename, importLayouts, reorder } = useLayoutsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [scanning, setScanning] = useState(false);

  const shareUrl = useMemo(() => (shareOpen ? layoutsShareUrl(layouts) : ''), [shareOpen, layouts]);

  // handle an incoming ?l=... import link
  useEffect(() => {
    const code = params.get('l');
    if (!code) return;
    try {
      const incoming = decodeLayouts(code);
      importLayouts(incoming);
      toast(`Imported ${incoming.length} grid${incoming.length === 1 ? '' : 's'}`);
    } catch {
      toast('Could not read that import link', 'info');
    }
    params.delete('l');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doImport = (text: string) => {
    try {
      const incoming = decodeLayouts(text);
      importLayouts(incoming);
      toast(`Imported ${incoming.length} grid${incoming.length === 1 ? '' : 's'}`);
      setImportOpen(false);
      setScanning(false);
      setImportText('');
    } catch {
      toast('Could not read that data', 'info');
    }
  };

  const saveCurrent = () => {
    const id = save(board.name.trim() || 'Untitled grid', board);
    void id;
    toast('Saved current grid');
  };

  const load = (l: SavedLayout) => {
    setBoard({ ...l.board }, l.id);
    navigate('/view');
  };

  const onImportFile = async (file: File) => {
    doImport(await file.text());
  };

  return (
    <div className="layouts-page">
      <div className="toolbar">
        <button className="btn primary" onClick={saveCurrent}>
          Save current grid
        </button>
        <div className="sep" />
        <button className="btn" onClick={() => setShareOpen(true)}>
          Share all
        </button>
        <button className="btn" onClick={() => setImportOpen(true)}>
          Import
        </button>
        <button className="btn" onClick={() => download('hero-grids.json', layouts)}>
          Export file
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import file
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
          {layouts.map((l, i) => (
            <li key={l.id} className="layout-row">
              <span className="sidebar-grid-reorder">
                <button title="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}>
                  ▲
                </button>
                <button
                  title="Move down"
                  disabled={i === layouts.length - 1}
                  onClick={() => reorder(i, i + 1)}
                >
                  ▼
                </button>
              </span>
              <span className="layout-name">
                <GridIcon tag={l.board.icon} />
                {l.name}
              </span>
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

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share all grids" width="40rem">
        <div className="share-body">
          <div className="share-main">
            <textarea
              className="input share-link"
              readOnly
              rows={5}
              value={shareUrl}
              onFocus={(e) => e.target.select()}
            />
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn primary" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                Copy link
              </button>
              <span className="muted" style={{ alignSelf: 'center' }}>
                {layouts.length} grids
              </span>
            </div>
          </div>
          <QRCode text={shareUrl} />
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setScanning(false);
        }}
        title="Import grids"
        width="34rem"
      >
        <p className="muted">Paste a shared link/text, or scan a QR code.</p>
        <textarea
          className="input"
          style={{ width: '100%' }}
          rows={4}
          placeholder="Paste here…"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn primary" disabled={!importText.trim()} onClick={() => doImport(importText)}>
            Import
          </button>
          <button className="btn" onClick={() => setScanning((s) => !s)}>
            {scanning ? 'Stop camera' : 'Scan QR'}
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: '0.75rem' }}>
            <QrScanner onResult={doImport} />
          </div>
        )}
      </Modal>
    </div>
  );
}
