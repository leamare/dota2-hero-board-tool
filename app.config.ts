/*
 * App configuration, at the root of the repo so it is easy to find and adjust.
 *
 * These are the defaults. Anything here can be overridden per environment with
 * the matching `VITE_*` variable in `.env` (see `.env.example`) — the app reads
 * this file through `src/lib/config.ts`, which applies those overrides.
 *
 * The version is not here: it comes from package.json, so there is one place to
 * bump for a release.
 */

export const appConfig = {
  /** Stats API. Point at a local LRG2 build to use endpoints that haven't shipped. */
  lrg2Api: 'https://stats.spectral.gg/lrg2/api/',

  /** Deployed stats API, used as a fallback when the one above can't answer. */
  lrg2ApiPublic: 'https://stats.spectral.gg/lrg2/api/',

  /** Image CDN: portraits, item icons, facet icons. */
  courierBase: 'https://courier.spectral.gg/images/dota',

  /** Public match history, for the personalised grids. */
  opendotaApi: 'https://api.opendota.com/api',

  /** Site the ❮ back-link returns to. */
  parentUrl: 'https://spectral.gg',

  /** The app's own landing route. */
  sectionHome: '/view',

  /** How long hero/item metadata is cached in the browser, in hours. */
  metadataCacheHours: 6,
} as const;

export type AppConfig = typeof appConfig;
