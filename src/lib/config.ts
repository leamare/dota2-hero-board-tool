/*
 * External service endpoints.
 *
 * Metadata (hero / item names, alticons) comes from the spectral LRG2 API.
 * Images (portraits, icons, items) come from the spectral courier CDN.
 * Nothing is downloaded or bundled — everything is referenced remotely.
 */

/** Bumped when there is something worth showing in the what's-new dialog. */
export const APP_VERSION = '2.0.0';

export const LRG2_API = 'https://stats.spectral.gg/lrg2/api/';

export const COURIER_BASE = 'https://courier.spectral.gg/images/dota';

/** Parent site the ❮ root-link returns to (one level up from this section). */
export const PARENT_URL = 'https://spectral.gg';

/** The section's own home — where the logo button leads. */
export const SECTION_HOME = '/view';

export const metadataUrl = (gets: string): string =>
  `${LRG2_API}?mod=metadata&gets=${encodeURIComponent(gets)}`;
