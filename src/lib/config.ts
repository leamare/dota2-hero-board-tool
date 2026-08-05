import { appConfig } from '../../app.config';

/*
 * Runtime configuration: the defaults from `app.config.ts` at the repo root,
 * with per-environment `VITE_*` overrides applied (see `.env.example`).
 *
 * Everything the app talks to is remote — metadata and stats from the spectral
 * LRG2 API, images from the spectral courier CDN, player history from OpenDota.
 * Nothing is downloaded or bundled.
 */

const env = import.meta.env;

/** Set from package.json at build time (see vite.config.ts). */
declare const __APP_VERSION__: string;

/** Shown in About, and what the what's-new dialog is keyed on. */
export const APP_VERSION = __APP_VERSION__;

export const LRG2_API = env.VITE_LRG2_API || appConfig.lrg2Api;
export const LRG2_API_PUBLIC = env.VITE_LRG2_API_PUBLIC || appConfig.lrg2ApiPublic;
export const COURIER_BASE = env.VITE_COURIER_BASE || appConfig.courierBase;
export const OPENDOTA_API = env.VITE_OPENDOTA_API || appConfig.opendotaApi;
export const PARENT_URL = env.VITE_PARENT_URL || appConfig.parentUrl;
export const SECTION_HOME = env.VITE_SECTION_HOME || appConfig.sectionHome;

/** Metadata cache lifetime, in milliseconds. */
export const METADATA_CACHE_TTL = appConfig.metadataCacheHours * 60 * 60 * 1000;

export const metadataUrl = (gets: string): string =>
  `${LRG2_API}?mod=metadata&gets=${encodeURIComponent(gets)}`;
