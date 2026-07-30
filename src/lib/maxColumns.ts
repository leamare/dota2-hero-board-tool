import { createContext, useContext } from 'react';

/** Minimum comfortable width for a full category, in rem. */
export const MIN_CATEGORY_REM = 16;
const GRID_GAP_REM = 0.6; // keep in sync with --grid-gap
const MAIN_PADDING_REM = 1.25; // .app-main padding

/**
 * How many `MIN_CATEGORY_REM`-wide categories fit across the given container,
 * accounting for the grid gap. At least 1. Columns then stretch to fill the
 * space, so a narrow (mobile) screen collapses to a single column.
 */
export function fitColumns(mainEl: HTMLElement): number {
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const avail = mainEl.clientWidth - MAIN_PADDING_REM * 2 * rootPx;
  const minCat = MIN_CATEGORY_REM * rootPx;
  const gap = GRID_GAP_REM * rootPx;
  return Math.max(1, Math.floor((avail + gap) / (minCat + gap)));
}

/** Max columns the current board area can fit (provided by Layout). */
export const MaxColumnsContext = createContext<number>(6);
export const useMaxColumns = (): number => useContext(MaxColumnsContext);
