import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { heroImageUrl, imageUrl, itemImageUrl } from '../../lib/images';
import { FACET_ICONS } from '../../lib/constants';
import { useMetadata } from '../../state/MetadataProvider';
import { useBoardStore } from '../../state/boardStore';
import type { CategoryIcon } from '../../types/board';

interface Props {
  categoryId: string | null;
  onClose: () => void;
}

type Tab = 'facet' | 'hero' | 'item';

const matches = (haystack: string, query: string): boolean =>
  query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));

/**
 * Picks a category icon: facet, hero, or item. A hidden "!!folder/tag" search
 * lets power users point at any courier image.
 */
export default function CategoryIconModal({ categoryId, onClose }: Props) {
  const meta = useMetadata();
  const category = useBoardStore((s) => s.board.categories.find((c) => c.id === categoryId));
  const patchCategory = useBoardStore((s) => s.patchCategory);

  const [tab, setTab] = useState<Tab>('facet');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categoryId) {
      setQuery('');
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [categoryId, tab]);

  const iconType = category?.icon?.iconType ?? 2;

  // hidden power-user escape: "!!folder/tag"
  const customIcon: CategoryIcon | null = useMemo(() => {
    if (!query.startsWith('!!')) return null;
    const rest = query.slice(2).trim();
    const slash = rest.indexOf('/');
    if (slash < 0) return null;
    return { kind: 'custom', folder: rest.slice(0, slash), tag: rest.slice(slash + 1) };
  }, [query]);

  const facets = useMemo(
    () => (query.trim() && !customIcon ? FACET_ICONS.filter((f) => matches(f, query)) : FACET_ICONS),
    [query, customIcon],
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
    return meta.items.filter((i) => matches(`${i.name} ${i.alt ?? ''} ${i.tag}`.toLowerCase(), query));
  }, [meta, query]);

  if (!categoryId || !category) return null;

  const set = (icon: CategoryIcon) => {
    patchCategory(categoryId, { icon });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Category icon" width="54rem">
      <div className="picker">
        <div className="picker-tabs">
          {(['facet', 'hero', 'item'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`btn small${tab === t ? ' primary' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'facet' ? 'Facets' : t === 'hero' ? 'Heroes' : 'Items'}
            </button>
          ))}
          <input
            ref={searchRef}
            className="input picker-search"
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {customIcon && (
          <div className="picker-grid">
            <button
              className="picker-tile item"
              title={`${customIcon.folder}/${customIcon.tag}`}
              onClick={() => set(customIcon)}
            >
              <img className="contain" src={imageUrl(customIcon.folder!, customIcon.tag!)} alt="custom" />
              <span>{customIcon.folder}/{customIcon.tag}</span>
            </button>
          </div>
        )}

        {!customIcon && tab === 'facet' && (
          <div className="picker-grid">
            {facets.map((f) => (
              <button
                key={f}
                className="picker-tile item"
                title={f}
                onClick={() => set({ kind: 'facet', folder: 'facets', tag: f })}
              >
                <img className="contain facet" src={imageUrl('facets', f)} alt={f} loading="lazy" />
                <span>{f}</span>
              </button>
            ))}
          </div>
        )}

        {!customIcon && tab === 'hero' && (
          <div className="picker-grid">
            {heroes.map((h) => (
              <button
                key={h.id}
                className="picker-tile"
                title={h.name}
                onClick={() => set({ kind: 'hero', refId: h.id, iconType })}
              >
                <img src={heroImageUrl(2, h.tag)} alt={h.name} loading="lazy" />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        )}

        {!customIcon && tab === 'item' && (
          <div className="picker-grid">
            {items.map((i) => (
              <button
                key={i.id}
                className="picker-tile item"
                title={i.name}
                onClick={() => set({ kind: 'item', refId: i.id, iconType })}
              >
                <img className="contain" src={itemImageUrl(0, i.tag)} alt={i.name} loading="lazy" />
                <span>{i.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
