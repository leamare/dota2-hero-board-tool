import { metadataUrl } from './config';
import type { Hero, Item, Metadata } from '../types/metadata';
import localAliases from '../data/heroes-aliases.json';

interface RawHero {
  tag: string;
  name: string;
  alt?: string;
  aliases?: string;
  aliases_more?: Record<string, string>;
  alticons?: string[];
}

interface RawResult<T> {
  result: T;
}

const splitAliases = (s: string | undefined): string[] =>
  (s ?? '')
    .split(/[,\s]+/)
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);

function normalizeHeroes(raw: Record<string, RawHero>): Hero[] {
  const aliasOverrides = localAliases as Record<string, string>;
  const heroes: Hero[] = [];

  for (const [idStr, h] of Object.entries(raw)) {
    const id = Number(idStr);
    const aliases = new Set<string>();
    splitAliases(h.aliases).forEach((a) => aliases.add(a));
    for (const more of Object.values(h.aliases_more ?? {})) {
      splitAliases(more).forEach((a) => aliases.add(a));
    }
    splitAliases(aliasOverrides[idStr]).forEach((a) => aliases.add(a));

    heroes.push({
      id,
      tag: h.tag,
      name: h.name,
      alt: h.alt || undefined,
      aliases: [...aliases],
      alticons: Array.isArray(h.alticons) ? h.alticons : [],
    });
  }

  heroes.sort((a, b) => a.name.localeCompare(b.name));
  return heroes;
}

const prettify = (tag: string): string =>
  tag
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

interface RawItem {
  id: number;
  /** internal name, e.g. "item_cyclone" */
  name: string;
  localized_name?: string;
  recipe?: number;
}

/**
 * `items_full` carries the in-game display name, which is often nothing like
 * the internal one — "item_cyclone" is Eul's Scepter of Divinity. The tag is
 * kept for the image path and for searching, since plenty of people know items
 * by their code name.
 */
function normalizeItems(raw: Record<string, RawItem>): Item[] {
  const items: Item[] = [];
  for (const entry of Object.values(raw)) {
    const tag = entry.name.replace(/^item_/, '');
    if (!tag || tag.startsWith('recipe_')) continue; // recipes aren't useful on a grid
    items.push({
      id: entry.id,
      tag,
      name: entry.localized_name?.trim() || prettify(tag),
      // only worth keeping when it isn't just the display name again
      alt: entry.localized_name ? prettify(tag) : undefined,
    });
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`metadata request failed: ${res.status}`);
  return (await res.json()) as T;
}

// v2: items carry their in-game names, so a v1 cache is stale by shape
const CACHE_KEY = 'hgt.metadata.v2';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface CachedMetadata {
  ts: number;
  heroes: Hero[];
  items: Item[];
}

const build = (heroes: Hero[], items: Item[]): Metadata => ({
  heroes,
  items,
  heroById: new Map(heroes.map((h) => [h.id, h])),
  itemById: new Map(items.map((i) => [i.id, i])),
});

function readCache(now: number): Metadata | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CachedMetadata;
    if (!c.ts || now - c.ts > CACHE_TTL || !c.heroes?.length) return null;
    return build(c.heroes, c.items);
  } catch {
    return null;
  }
}

let cached: Promise<Metadata> | undefined;

export function loadMetadata(): Promise<Metadata> {
  if (cached) return cached;

  // Date.now is fine at runtime in the browser
  const now = Date.now();
  const fromCache = readCache(now);
  if (fromCache) {
    cached = Promise.resolve(fromCache);
    return cached;
  }

  cached = (async () => {
    const [heroesRes, itemsRes] = await Promise.all([
      fetchJson<RawResult<{ heroes: Record<string, RawHero> }>>(metadataUrl('heroes')),
      fetchJson<RawResult<{ items_full: Record<string, RawItem> }>>(metadataUrl('items_full')),
    ]);

    const heroes = normalizeHeroes(heroesRes.result.heroes);
    const items = normalizeItems(itemsRes.result.items_full);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, heroes, items } satisfies CachedMetadata));
    } catch {
      /* quota — ignore, just skip caching */
    }

    return build(heroes, items);
  })();
  return cached;
}
