import { useLayoutsStore } from '../state/layoutsStore';
import {
  LEGACY_KEYS,
  convertLegacyLayouts,
  isLegacyLayouts,
  readLegacySettings,
} from './legacyImport';

const DONE_KEY = 'hgt.legacyImported';

/**
 * One-time upgrade from the original AngularJS tool: convert the grids it left
 * in `localStorage.layouts` into saved grids, then clear the keys it owned so
 * the conversion can't run twice. Returns how many grids were converted.
 *
 * Must run after the layouts store has rehydrated, otherwise persistence would
 * overwrite the imported grids.
 */
export function migrateLegacyData(): number {
  if (localStorage.getItem(DONE_KEY)) return 0;
  const raw = localStorage.getItem('layouts');
  if (!raw) return 0;

  let converted = 0;
  try {
    const parsed = JSON.parse(raw);
    if (isLegacyLayouts(parsed)) {
      const layouts = convertLegacyLayouts(parsed, readLegacySettings());
      if (layouts.length) {
        useLayoutsStore.getState().importLayouts(layouts);
        converted = layouts.length;
      }
    }
  } catch {
    /* unreadable legacy data — drop it rather than block the app */
  }

  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(DONE_KEY, '1');
  return converted;
}
