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
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GameGridModal from '../components/edit/GameGridModal';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore, type SavedLayout } from '../state/layoutsStore';
import { useToast } from '../state/ToastProvider';
import { useT } from '../lib/i18n';
import { encodeLayouts, layoutsShareUrl } from '../lib/layoutsShare';
import { parseImport } from '../lib/importAny';
import { downloadJson, downloadText, gridCode } from '../lib/gridFile';

export default function LayoutsPage() {
  const navigate = useNavigate();
  const lastTab = useUiStore((s) => s.lastBoardTab);
  const toast = useToast();
  const t = useT();
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
  const [confirmDelete, setConfirmDelete] = useState<SavedLayout | null>(null);
  const [gameMode, setGameMode] = useState<'import' | 'export' | null>(null);

  const shareUrl = useMemo(() => (shareOpen ? layoutsShareUrl(layouts) : ''), [shareOpen, layouts]);

  // handle an incoming ?l=... import link
  useEffect(() => {
    const code = params.get('l');
    if (!code) return;
    try {
      const incoming = parseImport(code);
      importLayouts(incoming);
      toast(t('toast.imported').replace('{n}', String(incoming.length)));
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
      toast(t('toast.imported').replace('{n}', String(incoming.length)));
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
          {t('layouts.saveCurrent')}
        </button>
        <div className="sep" />
        <button className="btn" onClick={() => setShareOpen(true)}>
          {t('layouts.shareAll')}
        </button>
        <button className="btn" onClick={() => setImportOpen(true)}>
          {t('common.import')}
        </button>
        <button className="btn" onClick={() => downloadJson('hero-grids', layouts)}>
          {t('layouts.exportJson')}
        </button>
        <button
          className="btn"
          title={t('layouts.exportCodeTitle')}
          onClick={() => downloadText('hero-grids', encodeLayouts(layouts))}
        >
          {t('layouts.exportCode')}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('layouts.importFile')}
        </button>
        <button
          className="btn"
          title={t('sidebar.gameFileHint')}
          onClick={() => setGameMode('import')}
        >
          {t('sidebar.gameImport')}
        </button>
        <button
          className="btn"
          title={t('sidebar.gameFileHint')}
          onClick={() => setGameMode('export')}
        >
          {t('sidebar.gameExport')}
        </button>
        <input
          ref={fileRef}
          type="file"
          // no `accept`: it filters the native picker by extension/MIME, and
          // hides a valid file if the OS doesn't recognise its name as JSON —
          // dropping the same file bypasses that filter and always works
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {layouts.length === 0 ? (
        <p className="board-empty">{t('layouts.empty')}</p>
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
                        {t('common.load')}
                      </button>
                      <button className="btn small" onClick={() => setShareGrid(l)}>
                        {t('common.share')}
                      </button>
                      <button className="btn small" onClick={() => overwrite(l.id, board)}>
                        {t('common.update')}
                      </button>
                      <button
                        className="btn small"
                        onClick={() => {
                          const n = prompt(t('layouts.renamePrompt'), l.name);
                          if (n?.trim()) rename(l.id, n.trim());
                        }}
                      >
                        {t('common.rename')}
                      </button>
                      <button className="btn small" onClick={() => downloadJson(l.name, l)}>
                        {t('common.export')}
                      </button>
                      <button
                        className="btn small"
                        title={t('layouts.gridCodeTitle')}
                        onClick={() => downloadText(l.name, gridCode(l.board))}
                      >
                        {t('common.code')}
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => setConfirmDelete(l)}
                      >
                        {t('common.delete')}
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <GameGridModal
        open={gameMode !== null}
        mode={gameMode ?? 'import'}
        onClose={() => setGameMode(null)}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t('confirm.deleteGridTitle')}
        confirmLabel={t('confirm.deleteGridConfirm')}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) remove(confirmDelete.id);
          setConfirmDelete(null);
        }}
      >
        <p>
          {t('confirm.deleteGridBody').replace('{name}', confirmDelete?.name ?? '')}
        </p>
      </ConfirmDialog>

      <ShareModal
        open={shareGrid !== null}
        board={shareGrid?.board}
        onClose={() => setShareGrid(null)}
      />

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title={t('layouts.shareAllTitle')} width="48rem">
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
                {t('common.copyLink')}
              </button>
              <span className="muted" style={{ alignSelf: 'center' }}>
                {t('layouts.gridsCount').replace('{n}', String(layouts.length))}
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
        title={t('layouts.importTitle')}
        width="34rem"
      >
        <p className="muted">
          {t('layouts.importHint')}
        </p>
        <textarea
          className="input"
          style={{ width: '100%' }}
          rows={4}
          placeholder={t('layouts.pastePlaceholder')}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn primary" disabled={!importText.trim()} onClick={() => doImport(importText)}>
            {t('common.import')}
          </button>
          <button className="btn" onClick={() => setScanning((s) => !s)}>
            {scanning ? t('common.stopCamera') : t('common.scanQr')}
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
