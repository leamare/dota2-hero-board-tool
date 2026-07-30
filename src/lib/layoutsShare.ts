import type { SavedLayout } from '../state/layoutsStore';
import { fromBase64Url, toBase64Url } from './bytes';
import { siteBaseUrl } from './shareUrl';

/** Pack all saved layouts into one URL-safe base64 string. */
export function encodeLayouts(layouts: SavedLayout[]): string {
  const json = JSON.stringify(layouts.map((l) => ({ name: l.name, board: l.board })));
  return toBase64Url(new TextEncoder().encode(json));
}

/** Read layouts from an encoded string (base64) or raw JSON. */
export function decodeLayouts(input: string): SavedLayout[] {
  const trimmed = input.trim();
  let json: string;
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    json = trimmed;
  } else {
    // may be a full URL with ?l=...
    const l = /[?&]l=([^&]+)/.exec(trimmed);
    const code = l ? l[1] : trimmed;
    json = new TextDecoder().decode(fromBase64Url(code));
  }
  const parsed = JSON.parse(json);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.filter((x) => x && x.board) as SavedLayout[];
}

/** Full URL that re-imports all layouts. */
export function layoutsShareUrl(layouts: SavedLayout[]): string {
  return `${siteBaseUrl()}layouts?l=${encodeLayouts(layouts)}`;
}
