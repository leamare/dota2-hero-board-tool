import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { heroImageUrl, itemImageUrl, portraitType } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';
import { useT } from '../../lib/i18n';
import type { GridElement } from '../../types/board';
import type { Hero, Item } from '../../types/metadata';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (element: GridElement) => void;
  /** portrait type of the target category, so previews match what's on the grid */
  previewType?: number;
  keepOpen?: boolean;
}

type Tab = 'hero' | 'item';

const matches = (haystack: string, query: string): boolean =>
  query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => haystack.includes(w));

export default function Picker({ open, onClose, onPick, previewType = 0, keepOpen }: Props) {
  const meta = useMetadata();
  const t = useT();
  const [tab, setTab] = useState<Tab>('hero');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // auto-focus the search box every time the picker opens
  useEffect(() => {
    if (open) {
      setQuery('');
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open, tab]);

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

  // secret: typing "!<tag>" in the item search offers a custom courier icon
  const customTag = tab === 'item' && query.startsWith('!') ? query.slice(1).trim() : '';

  const pick = (element: GridElement) => {
    onPick(element);
    if (!keepOpen) onClose();
  };

  const previewAspect = portraitType(previewType).aspect;
  const tileStyle = { aspectRatio: previewAspect };

  return (
    <Modal open={open} onClose={onClose} title={t('picker.add')} width="54rem">
      <div className="picker">
        <div className="picker-tabs">
          <button className={`btn small${tab === 'hero' ? ' primary' : ''}`} onClick={() => setTab('hero')}>
            {t('picker.heroes')}
          </button>
          <button className={`btn small${tab === 'item' ? ' primary' : ''}`} onClick={() => setTab('item')}>
            {t('picker.items')}
          </button>
          <button className="btn small" title="Add a blank block" onClick={() => pick({ kind: 'empty' })}>
            ＋ {t('picker.empty')}
          </button>
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
            {heroes.map((h) => (
              <button
                key={h.id}
                className="picker-tile"
                title={h.name}
                onClick={() => pick({ kind: 'hero', refId: h.id })}
              >
                <img style={tileStyle} src={heroImageUrl(previewType, h.tag)} alt={h.name} loading="lazy" />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'item' && (
          <div className="picker-grid">
            {customTag && (
              <button
                className="picker-tile item"
                title={`Custom icon: ${customTag}`}
                onClick={() => pick({ kind: 'custom', tag: customTag })}
              >
                <img style={tileStyle} className="contain" src={itemImageUrl(0, customTag)} alt={customTag} />
                <span>custom: {customTag}</span>
              </button>
            )}
            {items.map((i) => (
              <button
                key={i.id}
                className="picker-tile item"
                title={i.name}
                onClick={() => pick({ kind: 'item', refId: i.id })}
              >
                <img style={tileStyle} className="contain" src={itemImageUrl(0, i.tag)} alt={i.name} loading="lazy" />
                <span>{i.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
