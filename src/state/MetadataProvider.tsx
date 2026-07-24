import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadMetadata } from '../lib/metadata';
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
      .then((data) => alive && setState({ data, error: null }))
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
