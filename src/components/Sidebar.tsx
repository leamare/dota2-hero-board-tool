import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../state/boardStore';
import { useLayoutsStore } from '../state/layoutsStore';
import { useUiStore } from '../state/uiStore';
import { useToast } from '../state/ToastProvider';
import { COLUMN_OPTIONS } from '../lib/constants';
import { ITEM_STYLES, PORTRAIT_TYPES, SIZES, imageUrl } from '../lib/images';
import { emptyBoard } from '../lib/board';
import { useIsMobile } from '../lib/useIsMobile';
import { useT } from '../lib/i18n';
import GridIcon from './GridIcon';
import BoardIconModal from './edit/BoardIconModal';
import ShareModal from './edit/ShareModal';
import NameDialog from './ui/NameDialog';

const AUTOSAVE_KEY = 'hgt.autosave';

export default function Sidebar() {
  const navigate = useNavigate();
  const toast = useToast();
  const t = useT();

  const { sidebarOpen, sidebarPinned, setOpen, toggleOpen, setPinned } = useUiStore();
  const isMobile = useIsMobile();
  // on mobile the sidebar is always a plain overlay; pinning only affects desktop
  const pinned = sidebarPinned && !isMobile;
  const open = sidebarOpen || pinned;

  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const resetBoard = useBoardStore((s) => s.resetBoard);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const setCurrentLayoutId = useBoardStore((s) => s.setCurrentLayoutId);

  const { layouts, save, overwrite, remove } = useLayoutsStore();
  const current = layouts.find((l) => l.id === currentLayoutId) ?? null;

  const [iconModal, setIconModal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [autosave, setAutosave] = useState(() => localStorage.getItem(AUTOSAVE_KEY) !== '0');
  const firstRun = useRef(true);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0');
  }, [autosave]);

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
    setCurrentLayoutId(save(name, board));
    toast(`Saved "${name}"`);
  };

  const loadLayout = (id: string) => {
    const l = layouts.find((x) => x.id === id);
    if (!l) return;
    setBoard({ ...l.board }, l.id);
    navigate('/view');
    if (!pinned) setOpen(false);
  };

  const newGrid = () => {
    setBoard(emptyBoard(), null);
    navigate('/edit');
    if (!pinned) setOpen(false);
  };

  return (
    <>
      <button
        className={`sidebar-tab${open ? ' open' : ''}`}
        onClick={toggleOpen}
        title="Grids & settings"
        aria-label="Grids and settings"
      >
        {open ? '›' : '‹'}
      </button>

      <aside className={`sidebar${open ? ' open' : ''}`}>
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

        <div className="sidebar-section">
          <h3>{t('sidebar.currentGrid')}</h3>
          <div className="field row">
            <button className="btn icon-btn" title="Grid icon" onClick={() => setIconModal(true)}>
              {board.icon ? (
                <img src={imageUrl('facets', board.icon)} alt="" />
              ) : (
                <span className="muted">icon</span>
              )}
            </button>
            <input
              className="input"
              value={board.name}
              placeholder={t('sidebar.gridName')}
              onChange={(e) => patchBoard({ name: e.target.value })}
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
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
            {t('sidebar.autosave')}
          </label>
        </div>

        <div className="sidebar-section">
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
            onClick={() => confirm('Clear the whole board?') && resetBoard()}
          >
            {t('common.clear')}
          </button>
        </div>

        <div className="sidebar-section">
          <h3>{t('sidebar.savedGrids')}</h3>
          <div className="sidebar-actions">
            <button className="btn small primary" onClick={newGrid}>
              ＋ {t('common.newGrid')}
            </button>
          </div>
          <ul className="sidebar-grids">
            {layouts.length === 0 && <li className="muted">{t('sidebar.noGrids')}</li>}
            {layouts.map((l) => (
              <li key={l.id} className={l.id === currentLayoutId ? 'active' : undefined}>
                <button className="sidebar-grid-name" onClick={() => loadLayout(l.id)}>
                  <GridIcon tag={l.board.icon} />
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
      </aside>

      {open && !pinned && <div className="sidebar-scrim" onClick={() => { setOpen(false); if (sidebarPinned) setPinned(false); }} />}

      <BoardIconModal open={iconModal} onClose={() => setIconModal(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
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
