import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore } from '../state/layoutsStore';
import { useUiStore } from '../state/uiStore';
import { useToast } from '../state/ToastProvider';
import { COLUMN_OPTIONS, DEFAULT_GRID_ICON } from '../lib/constants';
import { ITEM_STYLES, PORTRAIT_TYPES, SIZES, imageUrl } from '../lib/images';
import { emptyBoard } from '../lib/board';
import { useIsMobile } from '../lib/useIsMobile';
import { useMaxColumns } from '../lib/maxColumns';
import { useT } from '../lib/i18n';
import SortableLayoutRow from './SortableLayoutRow';
import PickerGrid from './edit/PickerGrid';
import BoardIconModal from './edit/BoardIconModal';
import ShareModal from './edit/ShareModal';
import GameGridModal from './edit/GameGridModal';
import GameConfigButtons from './edit/GameConfigButtons';
import AutogridPanel from './edit/AutogridPanel';
import NameDialog from './ui/NameDialog';
import ConfirmDialog from './ui/ConfirmDialog';
import { useLoadLayout } from '../lib/useLoadLayout';

const AUTOSAVE_KEY = 'hgt.autosave';

export default function Sidebar() {
  const navigate = useNavigate();
  const toast = useToast();
  const t = useT();
  const maxColumns = useMaxColumns();
  const loadLayout = useLoadLayout();

  const { sidebarOpen, sidebarPinned, setOpen, toggleOpen, setPinned } = useUiStore();
  const openShareAt = useUiStore((s) => s.openShareAt);
  const isMobile = useIsMobile();
  // on mobile the sidebar is always a plain overlay; pinning only affects desktop
  const pinned = sidebarPinned && !isMobile;
  const open = sidebarOpen || pinned;

  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const resetBoard = useBoardStore((s) => s.resetBoard);
  const setCanvasMode = useBoardStore((s) => s.setCanvasMode);
  const applyAutoLayout = useBoardStore((s) => s.applyAutoLayout);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const setCurrentLayoutId = useBoardStore((s) => s.setCurrentLayoutId);

  const { layouts, save, overwrite, remove, reorder } = useLayoutsStore();
  const current = layouts.find((l) => l.id === currentLayoutId) ?? null;
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleLayoutDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = layouts.findIndex((l) => l.id === active.id);
    const to = layouts.findIndex((l) => l.id === over.id);
    if (from >= 0 && to >= 0) reorder(from, to);
  };

  const [tab, setTab] = useState<'settings' | 'heroes' | 'autogrid'>('settings');
  const [iconModal, setIconModal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [gameMode, setGameMode] = useState<'import' | 'export' | null>(null);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [confirmClassic, setConfirmClassic] = useState(false);
  const [confirmCanvas, setConfirmCanvas] = useState(false);
  // conversion options, remembered between toggles
  const [toCanvasOpts, setToCanvasOpts] = useState({ respectChains: true, eraseChains: true });
  const [toClassicOpts, setToClassicOpts] = useState({ adjustSizes: false, deduceChains: false });
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [autosave, setAutosave] = useState(() => localStorage.getItem(AUTOSAVE_KEY) !== '0');
  const firstRun = useRef(true);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0');
  }, [autosave]);

  // alt+w lives in the global hotkey handler, which can't reach this modal
  useEffect(() => {
    if (openShareAt) setShareOpen(true);
  }, [openShareAt]);

  // autosave to the tracked layout shortly after any change
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!autosave || !currentLayoutId) return;
    const timer = setTimeout(() => {
      overwrite(currentLayoutId, board);
      toast('Autosaved', 'info');
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, autosave, currentLayoutId]);

  const saveCurrent = () => {
    if (current) {
      overwrite(current.id, board);
      toast(`Saved "${current.name}"`);
    } else {
      // no tracked layout yet — save immediately under the grid's name
      const name = board.name.trim() || 'Untitled grid';
      setCurrentLayoutId(save(name, board));
      toast(`Saved "${name}"`);
    }
  };

  const doSaveAs = (name: string) => {
    // the saved copy becomes the grid you're working on, so rename it as well
    patchBoard({ name });
    setCurrentLayoutId(save(name, { ...board, name }));
    toast(`Saved "${name}"`);
  };


  const newGrid = () => {
    setBoard(emptyBoard(), null);
    navigate('/edit');
    if (!pinned) setOpen(false);
  };

  // swipe gesture: swipe in from the right edge to open, swipe the panel out to
  // close. the sidebar tracks the finger live so you see it move. pinned = off.
  const asideRef = useRef<HTMLElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{
    startX: number;
    startY: number;
    mode: 'open' | 'close';
    dragging: boolean;
  } | null>(null);

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      touch.current = null;
      if (pinned) return;
      const t = e.touches[0];
      if (!t) return;
      const fromEdge = window.innerWidth - t.clientX < 28;
      const inSidebar = !!asideRef.current?.contains(e.target as Node);
      const currentlyOpen = asideRef.current?.classList.contains('open');
      if (currentlyOpen && inSidebar) {
        touch.current = { startX: t.clientX, startY: t.clientY, mode: 'close', dragging: false };
      } else if (!currentlyOpen && fromEdge) {
        touch.current = { startX: t.clientX, startY: t.clientY, mode: 'open', dragging: false };
      }
    },
    [pinned],
  );

  const onTouchMove = useCallback((e: TouchEvent) => {
    const s = touch.current;
    const aside = asideRef.current;
    if (!s || !aside) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;
    if (!s.dragging) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        touch.current = null; // vertical scroll — bail out
        return;
      }
      s.dragging = true;
      aside.style.transition = 'none';
      if (tabRef.current) tabRef.current.style.transition = 'none';
    }
    const w = aside.offsetWidth;
    const offset = s.mode === 'open' ? clamp(w + dx, 0, w) : clamp(dx, 0, w);
    aside.style.transform = `translateX(${offset}px)`;
    // glue the toggle tab to the sidebar's left edge as it moves
    if (tabRef.current) tabRef.current.style.transform = `translateX(${offset - w}px)`;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const s = touch.current;
      touch.current = null;
      const aside = asideRef.current;
      if (aside) {
        aside.style.transition = '';
        aside.style.transform = '';
      }
      if (tabRef.current) {
        tabRef.current.style.transition = '';
        tabRef.current.style.transform = '';
      }
      if (!s || !s.dragging || pinned || !aside) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - s.startX;
      const w = aside.offsetWidth;
      if (s.mode === 'open') setOpen(-dx > w * 0.35);
      else setOpen(!(dx > w * 0.35));
    },
    [pinned, setOpen],
  );

  useEffect(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return (
    <>
      <button
        ref={tabRef}
        className={`sidebar-tab${open ? ' open' : ''}`}
        onClick={toggleOpen}
        title="Grids & settings"
        aria-label="Grids and settings"
      >
        {open ? '›' : '‹'}
      </button>

      <aside ref={asideRef} className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-head">
          <strong>{t('sidebar.title')}</strong>
          {!isMobile && (
            <label className="checkbox" title="Keep open and shift the page">
              <input
                type="checkbox"
                checked={sidebarPinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              {t('sidebar.pin')}
            </label>
          )}
        </div>

        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab-btn${tab === 'settings' ? ' active' : ''}`}
            onClick={() => setTab('settings')}
          >
            {t('sidebar.tabSettings')}
          </button>
          <button
            className={`sidebar-tab-btn${tab === 'heroes' ? ' active' : ''}`}
            onClick={() => setTab('heroes')}
          >
            {t('sidebar.tabHeroes')}
          </button>
          <button
            className={`sidebar-tab-btn${tab === 'autogrid' ? ' active' : ''}`}
            onClick={() => setTab('autogrid')}
          >
            {t('sidebar.tabAutogrid')}
          </button>
        </div>

        {tab === 'heroes' && (
          <div className="sidebar-heroes">
            <PickerGrid draggable autoFocus />
          </div>
        )}

        {tab === 'autogrid' && (
          <>
            <div className="sidebar-section">
              <h3>{t('autogrid.gameConfig')}</h3>
              <GameConfigButtons
                onImport={() => setGameMode('import')}
                onExport={() => setGameMode('export')}
              />
            </div>
            <div className="sidebar-section">
              <AutogridPanel />
            </div>
          </>
        )}

        <div className="sidebar-section" hidden={tab !== 'settings'}>
          <h3>{t('sidebar.currentGrid')}</h3>
          <div className="field row">
            <button className="btn icon-btn" title="Grid icon" onClick={() => setIconModal(true)}>
              <img className="facet" src={imageUrl('facets', board.icon || DEFAULT_GRID_ICON)} alt="" />
            </button>
            <input
              className="input"
              value={board.name}
              placeholder={t('sidebar.gridName')}
              onChange={(e) => patchBoard({ name: e.target.value })}
            />
          </div>
          <div className="field row">
            <input
              className="input"
              value={board.author ?? ''}
              placeholder={t('sidebar.author')}
              // stored only when non-empty, so grids stay authorless by default
              onChange={(e) => patchBoard({ author: e.target.value || undefined })}
            />
          </div>
          <div className="field row">
            <textarea
              className="input"
              rows={2}
              value={board.description ?? ''}
              placeholder={t('sidebar.description')}
              onChange={(e) => patchBoard({ description: e.target.value || undefined })}
            />
          </div>
          <div className="sidebar-actions">
            <button className="btn small primary" onClick={saveCurrent}>
              {t('common.save')}
            </button>
            <button className="btn small" onClick={() => setSaveAsOpen(true)}>
              {t('common.saveAs')}
            </button>
            <button className="btn small" onClick={() => setShareOpen(true)}>
              {t('common.share')}
            </button>
            <button
              className="btn small"
              onClick={() => {
                navigate('/print');
                if (!pinned) setOpen(false);
              }}
            >
              {t('common.print')}
            </button>
          </div>
          <GameConfigButtons
            onImport={() => setGameMode('import')}
            onExport={() => setGameMode('export')}
          />
          <label className="checkbox">
            <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
            {t('sidebar.autosave')}
          </label>
        </div>

        <div className="sidebar-section" hidden={tab !== 'settings'}>
          <h3>{t('sidebar.display')}</h3>
          <div className="field row">
            <label>{t('sidebar.columns')}</label>
            <select
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
          {maxColumns < board.columns && (
            <p className="field-hint">{t('sidebar.columnsCapped').replace('{n}', String(maxColumns))}</p>
          )}
          <div className="field row">
            <label>{t('sidebar.portraits')}</label>
            <select
              className="select"
              value={board.portraitType}
              onChange={(e) => patchBoard({ portraitType: Number(e.target.value) })}
            >
              {PORTRAIT_TYPES.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field row">
            <label>{t('sidebar.size')}</label>
            <select
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
            <label>{t('sidebar.items')}</label>
            <select
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={board.colorfulLabels}
              onChange={(e) => patchBoard({ colorfulLabels: e.target.checked })}
            />
            {t('sidebar.colorfulLabels')}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={board.centered}
              onChange={(e) => patchBoard({ centered: e.target.checked })}
            />
            {t('sidebar.centered')}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={board.darkenedBg}
              onChange={(e) => patchBoard({ darkenedBg: e.target.checked })}
            />
            {t('sidebar.darken')}
          </label>
          <button
            className="btn small danger"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setConfirmClear(true)}
          >
            {t('common.clear')}
          </button>

          <div className="canvas-toggle-block">
            <label className="switch" title={t('sidebar.canvasHint')}>
              <input
                type="checkbox"
                role="switch"
                checked={!!board.canvas}
                onChange={(e) => {
                  // both directions reshape the grid, so ask (and offer options)
                  if (e.target.checked) setConfirmCanvas(true);
                  else setConfirmClassic(true);
                }}
              />
              <span className="switch-track" aria-hidden="true" />
              <span className="switch-label">{t('sidebar.canvas')}</span>
            </label>
            <p className="field-hint">{t('sidebar.canvasHint')}</p>
            {board.canvas && (
              <button
                className="btn small"
                onClick={() => {
                  applyAutoLayout();
                  toast(t('sidebar.autoLayoutDone'));
                }}
              >
                {t('sidebar.autoLayout')}
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-section" hidden={tab !== 'settings'}>
          <h3>{t('sidebar.savedGrids')}</h3>
          <div className="sidebar-actions">
            <button className="btn small primary" onClick={newGrid}>
              ＋ {t('common.newGrid')}
            </button>
          </div>
          {layouts.length === 0 ? (
            <p className="muted">{t('sidebar.noGrids')}</p>
          ) : (
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLayoutDragEnd}
            >
              <SortableContext items={layouts.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <ul className="sidebar-grids">
                  {layouts.map((l) => (
                    <SortableLayoutRow
                      key={l.id}
                      layout={l}
                      active={l.id === currentLayoutId}
                      onLoad={() => loadLayout(l.id)}
                      onDelete={() => setConfirmDelete({ id: l.id, name: l.name })}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </aside>

      {open && !pinned && <div className="sidebar-scrim" onClick={() => { setOpen(false); if (sidebarPinned) setPinned(false); }} />}

      <BoardIconModal open={iconModal} onClose={() => setIconModal(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <GameGridModal
        open={gameMode !== null}
        mode={gameMode ?? 'import'}
        currentOnly
        onClose={() => setGameMode(null)}
      />
      <ConfirmDialog
        open={confirmCanvas}
        title={t('sidebar.canvasEnterTitle')}
        confirmLabel={t('sidebar.canvasEnterConfirm')}
        onCancel={() => setConfirmCanvas(false)}
        onConfirm={() => {
          setConfirmCanvas(false);
          setCanvasMode(true, toCanvasOpts);
        }}
      >
        <p>{t('sidebar.canvasEnterBody')}</p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={toCanvasOpts.respectChains}
            onChange={(e) => setToCanvasOpts((o) => ({ ...o, respectChains: e.target.checked }))}
          />
          {t('sidebar.optRespectChains')}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={toCanvasOpts.eraseChains}
            onChange={(e) => setToCanvasOpts((o) => ({ ...o, eraseChains: e.target.checked }))}
          />
          {t('sidebar.optEraseChains')}
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmClear}
        title={t('confirm.clearTitle')}
        confirmLabel={t('confirm.clearConfirm')}
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          resetBoard();
        }}
      >
        <p>{t('confirm.clearBody')}</p>
      </ConfirmDialog>

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
        <p>{t('confirm.deleteGridBody').replace('{name}', confirmDelete?.name ?? '')}</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmClassic}
        title={t('sidebar.canvasLeaveTitle')}
        confirmLabel={t('sidebar.canvasLeaveConfirm')}
        danger
        onCancel={() => setConfirmClassic(false)}
        onConfirm={() => {
          setConfirmClassic(false);
          setCanvasMode(false, toClassicOpts);
          toast(t('sidebar.canvasConverted'));
        }}
      >
        <p>{t('sidebar.canvasLeaveBody')}</p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={toClassicOpts.adjustSizes}
            onChange={(e) => setToClassicOpts((o) => ({ ...o, adjustSizes: e.target.checked }))}
          />
          {t('sidebar.optAdjustSizes')}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={toClassicOpts.deduceChains}
            onChange={(e) => setToClassicOpts((o) => ({ ...o, deduceChains: e.target.checked }))}
          />
          {t('sidebar.optDeduceChains')}
        </label>
      </ConfirmDialog>

      <NameDialog
        open={saveAsOpen}
        title="Save grid as"
        initial={board.name}
        onSubmit={doSaveAs}
        onClose={() => setSaveAsOpen(false)}
      />
    </>
  );
}
