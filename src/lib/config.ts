/*
 * External service endpoints.
 *
 * Metadata (hero / item names, alticons) comes from the spectral LRG2 API.
 * Images (portraits, icons, items) come from the spectral courier CDN.
 * Nothing is downloaded or bundled — everything is referenced remotely.
 */

export const LRG2_API = 'https://stats.spectral.gg/lrg2/api/';

export const COURIER_BASE = 'https://courier.spectral.gg/images/dota';

export const metadataUrl = (gets: string): string =>
  `${LRG2_API}?mod=metadata&gets=${encodeURIComponent(gets)}`;
