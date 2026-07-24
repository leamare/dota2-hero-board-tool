import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { imageUrl } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';
import type { ElementKind } from '../../lib/images';
import type { Hero, Item } from '../../types/metadata';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (kind: ElementKind, refId: number) => void;
  /** keep the picker open after a pick, for adding many at once */
  keepOpen?: boolean;
}

const matches = (haystack: string, query: string): boolean => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
};

export default function Picker({ open, onClose, onPick, keepOpen }: Props) {
  const meta = useMetadata();
  const [kind, setKind] = useState<ElementKind>('hero');
  const [query, setQuery] = useState('');

  const heroes = useMemo(() => {
    if (!meta || !query.trim()) return meta?.heroes ?? [];
    return meta.heroes.filter((h: Hero) =>
      matches([h.name, h.alt ?? '', h.tag, ...h.aliases].join(' ').toLowerCase(), query),
    );
  }, [meta, query]);

  const items = useMemo(() => {
    if (!meta || !query.trim()) return meta?.items ?? [];
    return meta.items.filter((i: Item) =>
      matches(`${i.name} ${i.tag}`.toLowerCase(), query),
    );
  }, [meta, query]);

  const pick = (k: ElementKind, id: number) => {
    onPick(k, id);
    if (!keepOpen) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to category" width="52rem">
      <div className="picker">
        <div className="picker-tabs">
          <button
            className={`btn small${kind === 'hero' ? ' primary' : ''}`}
            onClick={() => setKind('hero')}
          >
            Heroes
          </button>
          <button
            className={`btn small${kind === 'item' ? ' primary' : ''}`}
            onClick={() => setKind('item')}
          >
            Items
          </button>
          <input
            className="input picker-search"
            type="search"
            placeholder="Search…"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="picker-grid">
          {kind === 'hero'
            ? heroes.map((h) => (
                <button
                  key={h.id}
                  className="picker-tile"
                  title={h.name}
                  onClick={() => pick('hero', h.id)}
                >
                  <img src={imageUrl(0, h.tag)} alt={h.name} loading="lazy" />
                  <span>{h.name}</span>
                </button>
              ))
            : items.map((i) => (
                <button
                  key={i.id}
                  className="picker-tile item"
                  title={i.name}
                  onClick={() => pick('item', i.id)}
                >
                  <img src={imageUrl(3, i.tag)} alt={i.name} loading="lazy" />
                  <span>{i.name}</span>
                </button>
              ))}
        </div>
      </div>
    </Modal>
  );
}
