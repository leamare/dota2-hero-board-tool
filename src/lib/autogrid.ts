import { LRG2_API } from './config';
import { VERTICAL_PORTRAITS } from './images';
import { WIDENESS } from './constants';
import type { Board, Category, GridElement } from '../types/board';

/*
 * Stats-driven grids, built from the spectral.gg LRG2 reports.
 *
 * One request covers every role: `mod=heroes-positions-position_*` is a
 * repeater, so the response carries a per-position block of hero stats keyed by
 * the position code. Heroes are then filtered by pick volume and cut into tiers
 * by their `rank` score (a 0-100 composite the report computes).
 *
 * The reference implementation is XenSide/Spectral-Auto-HeroGrid, which writes
 * the same data straight into hero_grid_config.json.
 */

/** A report the API knows about, plus the label shown in the picker. */
export interface ReportOption {
  tag: string;
  label: string;
}

export const REPORTS: ReportOption[] = [
  { tag: 'imm_ranked_meta_last_7', label: 'Ranked Meta (last week)' },
  { tag: 'competitive_meta_last_14', label: 'Competitive Meta (last two weeks)' },
];

/** The five position codes the report exposes, as `<core>.<lane>`. */
export interface RoleDef {
  code: string;
  /** PRESET_NAMES value used for the category heading */
  preset: number;
  /** LABEL_COLORS key */
  color: string;
  /** short name used in generated grid names */
  name: string;
}

export const ROLES: RoleDef[] = [
  { code: '1.1', preset: 2, color: 'green', name: 'Safe Lane' },
  { code: '1.2', preset: 3, color: 'blue', name: 'Mid Lane' },
  { code: '1.3', preset: 4, color: 'orange', name: 'Off Lane' },
  { code: '0.3', preset: 5, color: 'violet', name: 'Position 4' },
  { code: '0.1', preset: 6, color: 'pink', name: 'Position 5' },
];

/** Six tiers, S down to E — presets 36..41 in PRESET_NAMES. */
export const TIERS: { preset: number; color: string }[] = [
  { preset: 36, color: 'red' },
  { preset: 37, color: 'orange' },
  { preset: 38, color: 'yellow' },
  { preset: 39, color: 'olive' },
  { preset: 40, color: 'teal' },
  { preset: 41, color: 'grey' },
];

export const TIER_COUNT = TIERS.length;

/** Heroes below this share of the median pick count are dropped as noise. */
export const MEDIAN_FLOOR = 0.9;

/** The per-hero fields this module reads out of a positions report. */
export interface HeroStat {
  matches_s: number;
  rank: number;
}

export type PositionStats = Record<string, HeroStat | null>;

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Split one position's heroes into six tiers.
 *
 * Heroes picked less than `MEDIAN_FLOOR` of the median are dropped, then the
 * survivors' rank span is cut into six equal-width bands — so tiers mean "this
 * far down the rank scale", not "this many heroes". Returns hero ids, best
 * first within each tier.
 */
export function tierBuckets(stats: PositionStats): number[][] {
  const rows = Object.entries(stats)
    .filter((entry): entry is [string, HeroStat] => !!entry[1])
    .map(([id, s]) => ({ id: Number(id), matches: s.matches_s, rank: s.rank }));

  const floor = median(rows.map((r) => r.matches)) * MEDIAN_FLOOR;
  const kept = rows.filter((r) => r.matches >= floor).sort((a, b) => b.rank - a.rank);

  const buckets: number[][] = Array.from({ length: TIER_COUNT }, () => []);
  if (!kept.length) return buckets;

  const hi = kept[0].rank;
  const lo = kept[kept.length - 1].rank;
  const span = (hi - lo) / TIER_COUNT;
  for (const hero of kept) {
    // span 0 means every survivor tied on rank — they all belong in the top tier
    const offset = span > 0 ? Math.floor((hi - hero.rank) / span) : 0;
    buckets[Math.min(TIER_COUNT - 1, offset)].push(hero.id);
  }
  return buckets;
}

/** All five positions of a report, keyed by position code. */
export type ReportPositions = Record<string, PositionStats>;

interface RepeaterResult {
  results?: Record<string, Record<string, PositionStats>>;
}

export const positionsUrl = (report: string): string =>
  `${LRG2_API}?league=${encodeURIComponent(report)}&mod=heroes-positions-position_*`;

/**
 * Fetch every position of a report in one request. The repeater nests each
 * block under its own code twice (`results['1.2']['1.2']`), which is flattened
 * here so callers just index by role code.
 */
export async function fetchPositions(report: string): Promise<ReportPositions> {
  const res = await fetch(positionsUrl(report));
  if (!res.ok) throw new Error(`Report request failed (${res.status})`);
  const body = (await res.json()) as { result?: RepeaterResult };
  const results = body.result?.results;
  if (!results) throw new Error('Report has no position data');

  const out: ReportPositions = {};
  for (const role of ROLES) {
    const block = results[role.code];
    const stats = block?.[role.code];
    if (stats) out[role.code] = stats;
  }
  if (!Object.keys(out).length) throw new Error('Report has no position data');
  return out;
}

const heroElements = (ids: number[], known: (id: number) => boolean): GridElement[] =>
  ids.filter(known).map((refId) => ({ kind: 'hero', refId }) as GridElement);

const baseBoard = (name: string, categories: Category[], columns: number): Board => ({
  name,
  icon: 'rng',
  columns,
  portraitType: VERTICAL_PORTRAITS,
  itemStyle: 0,
  size: 0,
  colorfulLabels: true,
  centered: false,
  darkenedBg: true,
  categories,
});

/** `YYYY-MM-DD` for the grid name, so regenerating doesn't clobber yesterday's. */
export const stamp = (at: Date = new Date()): string => at.toISOString().slice(0, 10);

export const roleGridName = (role: RoleDef, report: ReportOption, at?: Date): string =>
  `${role.name} tiers — ${report.label} (${stamp(at)})`;

export const totalGridName = (report: ReportOption, at?: Date): string =>
  `Meta tiers — ${report.label} (${stamp(at)})`;

/**
 * One role, one tier per row: six full-width categories labelled S..E Tier and
 * coloured by tier.
 */
export function buildRoleGrid(
  role: RoleDef,
  buckets: number[][],
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
): Board {
  const categories = TIERS.map((tier, i) => ({
    id: `${role.code.replace('.', '')}-t${i}`,
    preset: tier.preset,
    color: tier.color,
    wideness: WIDENESS.findIndex((w) => w.label === 'Full'),
    elements: heroElements(buckets[i] ?? [], known),
  }));
  return baseBoard(roleGridName(role, report, at), categories, 1);
}

/**
 * All five roles side by side: a column per role, a row per tier. Each column's
 * categories are chained vertically and share the role's colour; only the top
 * one carries the role name, so tiers read S→E downward.
 */
export function buildTotalGrid(
  byRole: Record<string, number[][]>,
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
): Board {
  const categories: Category[] = [];
  // row-major, so the classic layout places tier 0 across the top
  for (let tier = 0; tier < TIER_COUNT; tier++) {
    for (const role of ROLES) {
      categories.push({
        id: `${role.code.replace('.', '')}-t${tier}`,
        ...(tier === 0 ? { preset: role.preset } : {}),
        color: role.color,
        wideness: 0,
        vGroup: `col-${role.code}`,
        elements: heroElements(byRole[role.code]?.[tier] ?? [], known),
      });
    }
  }
  return baseBoard(totalGridName(report, at), categories, ROLES.length);
}
