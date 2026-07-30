import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUiStore } from '../state/uiStore';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LayoutRow from '../components/LayoutRow';
import Modal from '../components/ui/Modal';
import QRCode from '../components/ui/QRCode';
import QrScanner from '../components/ui/QrScanner';
import ShareModal from '../components/edit/ShareModal';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../state/layoutsStore';
import { useToast } from '../state/ToastProvider';
import { encodeLayouts, layoutsShareUrl } from '../lib/layoutsShare';
import { parseImport } from '../lib/importAny';
import { downloadJson, downloadText, gridCode } from '../lib/gridFile';

export default function LayoutsPage() {
  const navigate = useNavigate();
  const lastTab = useUiStore((s) => s.lastBoardTab);
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const { layouts, save, overwrite, remove, rename, importLayouts, reorder } = useLayoutsStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = layouts.findIndex((l) => l.id === active.id);
    const to = layouts.findIndex((l) => l.id === over.id);
    if (from >= 0 && to >= 0) reorder(from, to);
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [shareGrid, setShareGrid] = useState<SavedLayout | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [scanning, setScanning] = useState(false);

  const shareUrl = useMemo(() => (shareOpen ? layoutsShareUrl(layouts) : ''), [shareOpen, layouts]);

  // handle an incoming ?l=... import link
  useEffect(() => {
    const code = params.get('l');
    if (!code) return;
    try {
      const incoming = parseImport(code);
      importLayouts(incoming);
      toast(`Imported ${incoming.length} grid${incoming.length === 1 ? '' : 's'}`);
    } catch {
      toast('Could not read that import link', 'info');
    }
    params.delete('l');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // accepts a link, a bare grid code, JSON from this tool, or legacy JSON
  const doImport = (text: string) => {
    try {
      const incoming = parseImport(text);
      importLayouts(incoming);
      toast(`Imported ${incoming.length} grid${incoming.length === 1 ? '' : 's'}`);
      setImportOpen(false);
      setScanning(false);
      setImportText('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not read that data', 'info');
    }
  };

  const saveCurrent = () => {
    const id = save(board.name.trim() || 'Untitled grid', board);
    void id;
    toast('Saved current grid');
  };

  const load = (l: SavedLayout) => {
    setBoard({ ...l.board }, l.id);
    // open where the user last was, so coming from Edit keeps editing
    navigate(lastTab === 'edit' ? '/edit' : '/view');
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
        <button className="btn" onClick={() => downloadJson('hero-grids', layouts)}>
          Export .json
        </button>
        <button
          className="btn"
          title="All grids as one base64 code"
          onClick={() => downloadText('hero-grids', encodeLayouts(layouts))}
        >
          Export code
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,text/plain,.json,.txt"
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
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layouts.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="layouts-list">
              {layouts.map((l) => (
                <LayoutRow
                  key={l.id}
                  layout={l}
                  onOpen={() => load(l)}
                  actions={
                    <>
                      <button className="btn small primary" onClick={() => load(l)}>
                        Load
                      </button>
                      <button className="btn small" onClick={() => setShareGrid(l)}>
                        Share
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
                      <button className="btn small" onClick={() => downloadJson(l.name, l)}>
                        Export
                      </button>
                      <button
                        className="btn small"
                        title="Save this grid as a base64 code"
                        onClick={() => downloadText(l.name, gridCode(l.board))}
                      >
                        Code
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => confirm(`Delete "${l.name}"?`) && remove(l.id)}
                      >
                        Delete
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ShareModal
        open={shareGrid !== null}
        board={shareGrid?.board}
        onClose={() => setShareGrid(null)}
      />

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share all grids" width="48rem">
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
        <p className="muted">
          Paste a share link, a grid code, JSON from this tool or from the old version — or scan a
          QR code.
        </p>
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
