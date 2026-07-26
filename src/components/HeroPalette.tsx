import { useMemo, useState } from 'react';
import { useMetadata } from '../state/MetadataProvider';
import { heroImageUrl, itemImageUrl } from '../lib/images';
import { useT } from '../lib/i18n';
import type { GridElement } from '../types/board';
import type { Hero, Item } from '../types/metadata';

/** MIME type for a palette drag payload (a serialized GridElement). */
export const PALETTE_MIME = 'application/x-hgt-element';

const matches = (haystack: string, query: string): boolean =>
  query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));

const setDrag = (e: React.DragEvent, el: GridElement) => {
  e.dataTransfer.setData(PALETTE_MIME, JSON.stringify(el));
  e.dataTransfer.effectAllowed = 'copy';
};

/** A draggable grid of hero/item icons — drag one onto a category to add it. */
export default function HeroPalette() {
  const meta = useMetadata();
  const t = useT();
  const [tab, setTab] = useState<'hero' | 'item'>('hero');
  const [query, setQuery] = useState('');

  const heroes = useMemo(() => {
    if (!meta) return [];
    if (!query.trim()) return meta.heroes;
    return meta.heroes.filter((h: Hero) =>
      matches([h.name, h.alt ?? '', h.tag, ...h.aliases].join(' ').toLowerCase(), query),
    );
  }, [meta, query]);

  const items = useMemo(() => {
    if (!meta) return [];
    if (!query.trim()) return meta.items;
    return meta.items.filter((i: Item) => matches(`${i.name} ${i.tag}`.toLowerCase(), query));
  }, [meta, query]);

  return (
    <div className="palette">
      <div className="palette-tabs">
        <button
          className={`btn small${tab === 'hero' ? ' primary' : ''}`}
          onClick={() => setTab('hero')}
        >
          {t('picker.heroes')}
        </button>
        <button
          className={`btn small${tab === 'item' ? ' primary' : ''}`}
          onClick={() => setTab('item')}
        >
          {t('picker.items')}
        </button>
        <input
          className="input palette-search"
          type="search"
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="palette-grid">
        {tab === 'hero'
          ? heroes.map((h) => (
              <img
                key={h.id}
                className="palette-icon"
                src={heroImageUrl(2, h.tag)}
                alt={h.name}
                title={h.name}
                draggable
                loading="lazy"
                onDragStart={(e) => setDrag(e, { kind: 'hero', refId: h.id })}
              />
            ))
          : items.map((i) => (
              <img
                key={i.id}
                className="palette-icon item"
                src={itemImageUrl(0, i.tag)}
                alt={i.name}
                title={i.name}
                draggable
                loading="lazy"
                onDragStart={(e) => setDrag(e, { kind: 'item', refId: i.id })}
              />
            ))}
      </div>
    </div>
  );
}
