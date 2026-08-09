import { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import FileDropZone from '../ui/FileDropZone';
import { useBoardStore } from '../../state/boardStore';
import { useLayoutsStore } from '../../state/layoutsStore';
import { useMetadata } from '../../state/MetadataProvider';
import { useToast } from '../../state/ToastProvider';
import { useT } from '../../lib/i18n';
import { downloadJson } from '../../lib/gridFile';
import {
  GAME_CONFIG_FILENAME,
  GAME_CONFIG_PATH,
  importStamp,
  isGameGrid,
  fromGameGrid,
  toGameGrid,
} from '../../lib/gameGrid';

interface Props {
  open: boolean;
  onClose: () => void;
  /** which half of the exchange to show */
  mode: 'import' | 'export';
}

/**
 * Import from / export to Dota 2's own `hero_grid_config.json`, with a
 * reminder of where the game keeps it.
 */
export default function GameGridModal({ open, onClose, mode }: Props) {
  const meta = useMetadata();
  const toast = useToast();
  const t = useT();
  const board = useBoardStore((s) => s.board);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const { layouts, importLayouts } = useLayoutsStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [replaceSameName, setReplaceSameName] = useState(false);
  const [compact, setCompact] = useState(false);

  const doExport = (scope: 'current' | 'all') => {
    const live = { id: 'current', name: board.name || 'Grid', board };
    // the board in hand is newer than its saved copy — a canvas you just
    // arranged must export as it stands, not as it was last saved
    const source =
      scope === 'current' || !layouts.length
        ? [live]
        : layouts.map((l) => (l.id === currentLayoutId ? { ...l, board } : l));
    const file = toGameGrid(source, {
      heroTag: (id) => meta?.heroById.get(id)?.tag ?? String(id),
      itemTag: (id) => meta?.itemById.get(id)?.tag ?? String(id),
      compact,
    });
    downloadJson(GAME_CONFIG_FILENAME.replace(/\.json$/, ''), file);
    toast(t('game.exported').replace('{n}', String(file.configs.length)));
  };

  const doImport = async (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!isGameGrid(parsed)) throw new Error('not a hero grid config');
      const incoming = fromGameGrid(parsed);
      importLayouts(incoming, { replaceSameName, stamp: importStamp() });
      toast(t('game.imported').replace('{n}', String(incoming.length)));
      onClose();
    } catch {
      toast(t('game.notConfig'), 'info');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(mode === 'import' ? 'sidebar.gameImport' : 'sidebar.gameExport')}
      width="40rem"
    >
      <p className="muted">
        {t(mode === 'import' ? 'game.importIntro' : 'game.exportIntro')}
      </p>
      <p className="path-hint">
        <code>{GAME_CONFIG_PATH}</code>
      </p>

      {mode === 'import' ? (
        <>
      <FileDropZone accept="application/json,.json" onFile={(f) => f.text().then(doImport)}>
        {t('game.dropHere').split('{file}')[0]}
        <code>{GAME_CONFIG_FILENAME}</code>
        {t('game.dropHere').split('{file}')[1]}{' '}
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          {t('game.chooseFile')}
        </button>
        .
      </FileDropZone>
      <input
        ref={fileRef}
        type="file"
        // no `accept`: it filters the native picker by extension/MIME, and on
        // some OSes that hides a valid file whose name the OS doesn't
        // recognise as JSON — drag-and-drop isn't filtered, so it always
        // works. Content is validated after reading either way.
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) f.text().then(doImport);
          e.target.value = '';
        }}
      />
      <label className="checkbox">
        <input
          type="checkbox"
          checked={replaceSameName}
          onChange={(e) => setReplaceSameName(e.target.checked)}
        />
        {t('game.replaceSame')}
      </label>
      <p className="field-hint">{t('game.replaceHint')}</p>
        </>
      ) : (
        <>
          <p className="muted">{t('game.exportNote')}</p>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
            />
            {t('game.compact')}
          </label>
          <p className="field-hint">{t('game.compactHint')}</p>
          <div className="sidebar-actions">
            <button className="btn primary" onClick={() => doExport('current')}>
              {t('game.downloadCurrent').replace('{file}', GAME_CONFIG_FILENAME)}
            </button>
            <button className="btn" onClick={() => doExport('all')}>
              {t('game.downloadAll').replace('{file}', GAME_CONFIG_FILENAME)}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
