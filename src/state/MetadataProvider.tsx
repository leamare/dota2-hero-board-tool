import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadMetadata } from '../lib/metadata';
import { setTagResolver } from '../lib/gameGrid';
import type { Metadata } from '../types/metadata';

interface MetadataState {
  data: Metadata | null;
  error: string | null;
}

const MetadataContext = createContext<MetadataState>({ data: null, error: null });

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MetadataState>({ data: null, error: null });

  useEffect(() => {
    let alive = true;
    loadMetadata()
      .then((data) => {
        if (!alive) return;
        setState({ data, error: null });
        // lets the game-grid importer turn a "{S:spectre}" label back into an icon
        const heroes = new Map(data.heroes.map((h) => [h.tag, h.id]));
        const items = new Map(data.items.map((i) => [i.tag, i.id]));
        setTagResolver((tag) => {
          const hero = heroes.get(tag);
          if (hero != null) return { kind: 'hero', refId: hero };
          const item = items.get(tag);
          if (item != null) return { kind: 'item', refId: item };
          return null;
        });
      })
      .catch((e: unknown) =>
        alive && setState({ data: null, error: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      alive = false;
    };
  }, []);

  return <MetadataContext.Provider value={state}>{children}</MetadataContext.Provider>;
}

/** Returns loaded metadata, or null while loading. */
export function useMetadata(): Metadata | null {
  return useContext(MetadataContext).data;
}

export function useMetadataState(): MetadataState {
  return useContext(MetadataContext);
}
