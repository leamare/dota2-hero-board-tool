import { useEffect, useState } from 'react';
import { useT } from '../../lib/i18n';
import { useLayoutsStore } from '../../state/layoutsStore';
import { useToast } from '../../state/ToastProvider';
import { parseImport } from '../../lib/importAny';
import { importStamp } from '../../lib/gameGrid';

/**
 * Drop a grid file anywhere in the window to import it — a share code, JSON
 * from this tool, a file from the old version, or the game's
 * hero_grid_config.json. `parseImport` works out which it is.
 */
export default function GlobalFileDrop() {
  const t = useT();
  const [over, setOver] = useState(false);
  const importLayouts = useLayoutsStore((s) => s.importLayouts);
  const toast = useToast();

  useEffect(() => {
    // only react to actual files, not to text or the app's own drag-and-drop
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types?.includes('Files');
    let depth = 0;

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setOver(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        const incoming = parseImport(await file.text());
        importLayouts(incoming, { stamp: importStamp() });
        toast(t('toast.imported').replace('{n}', String(incoming.length)));
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not read that file', 'info');
      }
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [importLayouts, toast]);

  if (!over) return null;
  return (
    <div className="global-drop" aria-hidden="true">
      <div className="global-drop-inner">{t('ui.dropFile')}</div>
    </div>
  );
}
