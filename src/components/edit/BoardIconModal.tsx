import { useMemo, useState } from 'react';
import { useT } from '../../lib/i18n';
import Modal from '../ui/Modal';
import { imageUrl } from '../../lib/images';
import { FACET_ICONS } from '../../lib/constants';
import { useBoardStore } from '../../state/boardStore';

/** Picks the grid's facet icon (or clears it). */
export default function BoardIconModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const patchBoard = useBoardStore((s) => s.patchBoard);
  const [query, setQuery] = useState('');
  const facets = useMemo(
    () => (query.trim() ? FACET_ICONS.filter((f) => f.includes(query.toLowerCase())) : FACET_ICONS),
    [query],
  );

  const set = (icon: string) => {
    patchBoard({ icon });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('cat.gridIcon')} width="52rem">
      <div className="picker">
        <div className="picker-tabs">
          <button className="btn small" onClick={() => set('')}>
            No icon
          </button>
          <input
            className="input picker-search"
            type="search"
            placeholder={t('cat.searchFacets')}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="picker-grid">
          {facets.map((f) => (
            <button key={f} className="picker-tile item" title={f} onClick={() => set(f)}>
              <img className="contain facet" src={imageUrl('facets', f)} alt={f} loading="lazy" />
              <span>{f}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
