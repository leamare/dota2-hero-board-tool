import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { heroImageUrl, imageUrl, itemImageUrl } from '../../lib/images';
import { FACET_ICONS } from '../../lib/constants';
import { useMetadata } from '../../state/MetadataProvider';
import { useBoardStore } from '../../state/boardStore';
import type { CategoryName } from '../../types/board';

interface Props {
  categoryId: string | null;
  onClose: () => void;
}

type Tab = 'facet' | 'hero' | 'item' | 'custom';

const matches = (haystack: string, query: string): boolean =>
  query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));

/** Picks the icon shown as a category label: facet, hero, item, or a custom courier tag. */
export default function CategoryIconModal({ categoryId, onClose }: Props) {
  const meta = useMetadata();
  const category = useBoardStore((s) => s.board.categories.find((c) => c.id === categoryId));
  const patchCategory = useBoardStore((s) => s.patchCategory);

  const [tab, setTab] = useState<Tab>('facet');
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categoryId) {
      setQuery('');
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [categoryId, tab]);

  const iconType = category?.name.iconType ?? 2;

  const facets = useMemo(
    () => (query.trim() ? FACET_ICONS.filter((f) => matches(f, query)) : FACET_ICONS),
    [query],
  );
  const heroes = useMemo(() => {
    if (!meta) return [];
    if (!query.trim()) return meta.heroes;
    return meta.heroes.filter((h) =>
      matches([h.name, h.alt ?? '', h.tag, ...h.aliases].join(' ').toLowerCase(), query),
    );
  }, [meta, query]);
  const items = useMemo(() => {
    if (!meta) return [];
    if (!query.trim()) return meta.items;
    return meta.items.filter((i) => matches(`${i.name} ${i.tag}`.toLowerCase(), query));
  }, [meta, query]);

  if (!categoryId || !category) return null;

  const set = (name: CategoryName) => {
    patchCategory(categoryId, { name });
    onClose();
  };

  const addCustom = () => {
    // accept "!!folder/tag" or "folder/tag"
    const cleaned = custom.replace(/^!!/, '').trim();
    const slash = cleaned.indexOf('/');
    if (slash < 0) return;
    set({
      type: 'icon',
      iconFolder: cleaned.slice(0, slash),
      iconTag: cleaned.slice(slash + 1),
    });
  };

  return (
    <Modal open onClose={onClose} title="Category icon" width="54rem">
      <div className="picker">
        <div className="picker-tabs">
          {(['facet', 'hero', 'item', 'custom'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`btn small${tab === t ? ' primary' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'facet' ? 'Facets' : t === 'hero' ? 'Heroes' : t === 'item' ? 'Items' : 'Custom'}
            </button>
          ))}
          {tab !== 'custom' && (
            <input
              ref={searchRef}
              className="input picker-search"
              type="search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </div>

        {tab === 'facet' && (
          <div className="picker-grid">
            {facets.map((f) => (
              <button
                key={f}
                className="picker-tile item"
                title={f}
                onClick={() => set({ type: 'icon', iconFolder: 'facets', iconTag: f })}
              >
                <img className="contain" src={imageUrl('facets', f)} alt={f} loading="lazy" />
                <span>{f}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'hero' && (
          <div className="picker-grid">
            {heroes.map((h) => (
              <button
                key={h.id}
                className="picker-tile"
                title={h.name}
                onClick={() => set({ type: 'hero', refId: h.id, iconType })}
              >
                <img src={heroImageUrl(2, h.tag)} alt={h.name} loading="lazy" />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'item' && (
          <div className="picker-grid">
            {items.map((i) => (
              <button
                key={i.id}
                className="picker-tile item"
                title={i.name}
                onClick={() => set({ type: 'item', refId: i.id, iconType })}
              >
                <img className="contain" src={itemImageUrl(0, i.tag)} alt={i.name} loading="lazy" />
                <span>{i.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'custom' && (
          <div className="picker-special">
            <div className="field">
              <label>Custom courier icon</label>
              <p className="muted">
                Enter <code>!!folder/tag</code> — any image under courier, e.g.{' '}
                <code>!!facets/mana</code> or <code>!!ranks/rank_7</code>.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  placeholder="!!folder/tag"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                />
                <button className="btn primary" disabled={!custom.includes('/')} onClick={addCustom}>
                  Use
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
