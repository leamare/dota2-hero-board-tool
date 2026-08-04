/*
 * External service endpoints.
 *
 * Metadata (hero / item names, alticons) comes from the spectral LRG2 API.
 * Images (portraits, icons, items) come from the spectral courier CDN.
 * Player stats come from OpenDota. Nothing is downloaded or bundled —
 * everything is referenced remotely.
 *
 * Every value can be overridden from the environment at build time (see
 * `.env.example`); the defaults below are what production uses, so a checkout
 * with no `.env` at all still builds correctly.
 */

const env = import.meta.env;

/** Bumped when there is something worth showing in the what's-new dialog. */
export const APP_VERSION = env.VITE_APP_VERSION || '2.0.0';

/**
 * The stats API. `.env` currently points this at a local LRG2 build, which is
 * where the tier-list and meta-level endpoints live until they ship; drop that
 * line to go back to the deployed one.
 */
export const LRG2_API = env.VITE_LRG2_API || 'https://stats.spectral.gg/lrg2/api/';

/** The deployed API, used to fall back when the one above can't answer. */
export const LRG2_API_PUBLIC = env.VITE_LRG2_API_PUBLIC || 'https://stats.spectral.gg/lrg2/api/';

export const COURIER_BASE = env.VITE_COURIER_BASE || 'https://courier.spectral.gg/images/dota';

/** Public match history, used for the personalised grids. */
export const OPENDOTA_API = env.VITE_OPENDOTA_API || 'https://api.opendota.com/api';

/** Parent site the ❮ root-link returns to (one level up from this section). */
export const PARENT_URL = env.VITE_PARENT_URL || 'https://spectral.gg';

/** The section's own home — where the logo button leads. */
export const SECTION_HOME = env.VITE_SECTION_HOME || '/view';

export const metadataUrl = (gets: string): string =>
  `${LRG2_API}?mod=metadata&gets=${encodeURIComponent(gets)}`;
