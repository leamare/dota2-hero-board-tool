import { useEffect, useMemo, useRef, useState } from 'react';
import { heroImageUrl, itemImageUrl, portraitType } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';
import { useT } from '../../lib/i18n';
import { PALETTE_MIME } from '../../lib/dnd';
import type { GridElement } from '../../types/board';
import type { Hero, Item } from '../../types/metadata';

interface Props {
  /** picking adds the element (click). omit for a drag-only palette */
  onPick?: (element: GridElement) => void;
  /** portrait type used for hero previews, so they match the target grid */
  previewType?: number;
  /** make the icons draggable (native DnD onto categories) */
  draggable?: boolean;
  autoFocus?: boolean;
}

type Tab = 'hero' | 'item';

const matches = (haystack: string, query: string): boolean =>
  query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));

const setDrag = (e: React.DragEvent, el: GridElement) => {
  e.dataTransfer.setData(PALETTE_MIME, JSON.stringify(el));
  e.dataTransfer.effectAllowed = 'copy';
  // let the drag reach categories behind the sidebar's dimmer scrim
  document.body.classList.add('palette-dragging');
};
const endDrag = () => document.body.classList.remove('palette-dragging');

/**
 * The shared hero/item browser: Heroes / Items tabs, a search box and a grid of
 * named tiles. Used both inside the "add to category" modal and the sidebar's
 * Heroes tab, so they look and behave identically.
 */
export default function PickerGrid({ onPick, previewType = 0, draggable, autoFocus }: Props) {
  const meta = useMetadata();
  const t = useT();
  const [tab, setTab] = useState<Tab>('hero');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const id = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [autoFocus, tab]);

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
    return meta.items.filter((i: Item) => matches(`${i.name} ${i.alt ?? ''} ${i.tag}`.toLowerCase(), query));
  }, [meta, query]);

  // typing "!<tag>" offers a raw courier icon, for heroes and items the
  // metadata doesn't list yet (new heroes, seasonal art, and so on)
  const rawTag = query.startsWith('!') ? query.slice(1).trim() : '';

  const tileStyle = { aspectRatio: portraitType(previewType).aspect };

  // `key` is the element identity, not the label: two items can share a display
  // name (there are two "Restorative"s), and a duplicate key leaves React
  // holding a stale tile that then shows up in every later search
  const tile = (key: string, el: GridElement, src: string, label: string, contain: boolean) => (
    <button
      key={key}
      className={`picker-tile${contain ? ' item' : ''}`}
      title={label}
      draggable={draggable}
      onDragStart={draggable ? (e) => setDrag(e, el) : undefined}
      onDragEnd={draggable ? endDrag : undefined}
      onClick={onPick ? () => onPick(el) : undefined}
    >
      <img
        style={tileStyle}
        className={contain ? 'contain' : undefined}
        src={src}
        alt={label}
        loading="lazy"
      />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="picker">
      <div className="picker-tabs">
        <button className={`btn small${tab === 'hero' ? ' primary' : ''}`} onClick={() => setTab('hero')}>
          {t('picker.heroes')}
        </button>
        <button className={`btn small${tab === 'item' ? ' primary' : ''}`} onClick={() => setTab('item')}>
          {t('picker.items')}
        </button>
        {onPick && (
          <button className="btn small" title={t('cat.addBlank')} onClick={() => onPick({ kind: 'empty' })}>
            ＋ {t('picker.empty')}
          </button>
        )}
        {onPick && (
          <button
            className="btn small"
            title={t('cat.addBreak')}
            onClick={() => onPick({ kind: 'break' })}
          >
            ＋ {t('picker.break')}
          </button>
        )}
        <input
          ref={searchRef}
          className="input picker-search"
          type="search"
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === 'hero' && (
        <div className="picker-grid">
          {rawTag &&
            tile(
              `raw:${rawTag}`,
              { kind: 'hero', tag: rawTag },
              heroImageUrl(previewType, rawTag),
              `custom: ${rawTag}`,
              false,
            )}
          {heroes.map((h) =>
            tile(
              `hero:${h.id}`,
              { kind: 'hero', refId: h.id },
              heroImageUrl(previewType, h.tag),
              h.name,
              false,
            ),
          )}
        </div>
      )}

      {tab === 'item' && (
        <div className="picker-grid">
          {rawTag &&
            tile(
              `raw:${rawTag}`,
              { kind: 'custom', tag: rawTag },
              itemImageUrl(0, rawTag),
              `custom: ${rawTag}`,
              true,
            )}
          {items.map((i) =>
            tile(`item:${i.id}`, { kind: 'item', refId: i.id }, itemImageUrl(0, i.tag), i.name, true),
          )}
        </div>
      )}
    </div>
  );
}
