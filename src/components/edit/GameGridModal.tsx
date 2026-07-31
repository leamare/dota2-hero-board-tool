import { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import FileDropZone from '../ui/FileDropZone';
import { useBoardStore } from '../../state/boardStore';
import { useLayoutsStore } from '../../state/layoutsStore';
import { useMetadata } from '../../state/MetadataProvider';
import { useToast } from '../../state/ToastProvider';
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
  /** export only the grid being edited instead of every saved grid */
  currentOnly?: boolean;
}

/**
 * Import from / export to Dota 2's own `hero_grid_config.json`, with a
 * reminder of where the game keeps it.
 */
export default function GameGridModal({ open, onClose, mode, currentOnly }: Props) {
  const meta = useMetadata();
  const toast = useToast();
  const board = useBoardStore((s) => s.board);
  const currentLayoutId = useBoardStore((s) => s.currentLayoutId);
  const { layouts, importLayouts } = useLayoutsStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [replaceSameName, setReplaceSameName] = useState(false);

  const doExport = () => {
    const live = { id: 'current', name: board.name || 'Grid', board };
    // the board in hand is newer than its saved copy — a canvas you just
    // arranged must export as it stands, not as it was last saved
    const source = currentOnly
      ? [live]
      : layouts.length
        ? layouts.map((l) => (l.id === currentLayoutId ? { ...l, board } : l))
        : [live];
    const file = toGameGrid(source, {
      heroTag: (id) => meta?.heroById.get(id)?.tag ?? String(id),
      itemTag: (id) => meta?.itemById.get(id)?.tag ?? String(id),
    });
    downloadJson(GAME_CONFIG_FILENAME.replace(/\.json$/, ''), file);
    toast(`Exported ${file.configs.length} grid${file.configs.length === 1 ? '' : 's'}`);
  };

  const doImport = async (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!isGameGrid(parsed)) throw new Error('not a hero grid config');
      const incoming = fromGameGrid(parsed);
      importLayouts(incoming, { replaceSameName, stamp: importStamp() });
      toast(`Imported ${incoming.length} grid${incoming.length === 1 ? '' : 's'} from the game`);
      onClose();
    } catch {
      toast('That file is not a hero_grid_config.json', 'info');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'import' ? 'Import game grids' : 'Export game grids'}
      width="40rem"
    >
      <p className="muted">
        {mode === 'import'
          ? 'The game keeps every hero grid in one config file. Import it to bring your in-game grids here.'
          : 'Save your grids as the game\'s own config file, then drop it in next to the one the game wrote.'}
      </p>
      <p className="path-hint">
        <code>{GAME_CONFIG_PATH}</code>
      </p>

      {mode === 'import' ? (
        <>
      <FileDropZone accept="application/json,.json" onFile={(f) => f.text().then(doImport)}>
        Drop <code>{GAME_CONFIG_FILENAME}</code> here, or{' '}
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          choose a file
        </button>
        .
      </FileDropZone>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
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
        Replace grids with the same name
      </label>
      <p className="field-hint">
        Otherwise an imported grid whose name already exists is kept alongside it, stamped with the
        import time.
      </p>
        </>
      ) : (
        <>
          <p className="muted">
            In-game grids only store hero positions, so items, alternate portraits and colours are
            dropped. A category icon travels as <code>{'{S:spectre}'}</code>, and a row break splits
            the category into blocks named <code>------</code> — both are restored if you import the
            file back here.
          </p>
          <button className="btn primary" onClick={doExport}>
            Download {GAME_CONFIG_FILENAME}
          </button>
        </>
      )}
    </Modal>
  );
}
