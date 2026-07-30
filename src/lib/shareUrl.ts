import type { Board } from '../types/board';
import { encodeBoard } from './share';

/**
 * Where the app is actually deployed, with a trailing slash — the current origin
 * plus the build's base path, so links and the credit shown on exported images
 * stay correct under a sub-path deployment.
 */
export function siteBaseUrl(): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const base = import.meta.env.BASE_URL || '/';
  return `${origin}${base.endsWith('/') ? base : `${base}/`}`;
}

/** The same base, tidied for display: no protocol, no trailing slash. */
export const siteBaseLabel = (): string =>
  siteBaseUrl()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

/** Full shareable URL that opens the import page with the encoded board. */
export function buildShareUrl(board: Board): string {
  return `${siteBaseUrl()}import?b=${encodeBoard(board)}`;
}
