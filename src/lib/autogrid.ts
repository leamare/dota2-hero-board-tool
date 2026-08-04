import { LRG2_API, LRG2_API_PUBLIC } from './config';
import { SIZES, VERTICAL_PORTRAITS } from './images';
import { WIDENESS, presetLabel } from './constants';
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

/** Portrait sizes the generated grids use — dense grids get the smaller one. */
export const MEDIUM_SIZE = SIZES.findIndex((s) => s.label === 'Medium');
export const LARGE_SIZE = SIZES.findIndex((s) => s.label === 'Large');

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

/**
 * Share of the ranked pool each tier takes, top first.
 *
 * Cutting the *rank span* into equal bands sounds right but the rank scale is
 * lumpy and lumpy in a different way per position — one role ends up with 26
 * heroes in S while another has 1. Splitting by share of the pool instead keeps
 * the pyramid shape everywhere; the rank values at the cuts are reported in the
 * grid description so the numbers behind a tier are still visible.
 */
export const TIER_SHARES = [0.08, 0.14, 0.2, 0.22, 0.18, 0.18];

/** Heroes below this share of the median pick count are dropped as noise. */
export const MEDIAN_FLOOR = 0.9;

/** The per-hero fields this module reads out of a positions report. */
export interface HeroStat {
  matches_s: number;
  rank: number;
}

export type PositionStats = Record<string, HeroStat | null>;

/** A tier's hero ids plus the rank window they landed in. */
export interface TierSplit {
  buckets: number[][];
  /** `[highest, lowest]` rank in each tier; `null` for an empty tier */
  ranges: ([number, number] | null)[];
}

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Slice a rank-sorted list into tiers by `TIER_SHARES`. */
function splitByShare(ranked: { id: number; rank: number }[]): TierSplit {
  const buckets: number[][] = [];
  const ranges: ([number, number] | null)[] = [];
  let at = 0;
  let acc = 0;
  for (let i = 0; i < TIER_COUNT; i++) {
    acc += TIER_SHARES[i];
    const end = i === TIER_COUNT - 1 ? ranked.length : Math.round(ranked.length * acc);
    const band = ranked.slice(at, Math.max(at, end));
    at = Math.max(at, end);
    buckets.push(band.map((h) => h.id));
    ranges.push(band.length ? [band[0].rank, band[band.length - 1].rank] : null);
  }
  return { buckets, ranges };
}

/**
 * Split one position's heroes into six tiers, best first within each.
 *
 * Heroes picked less than `MEDIAN_FLOOR` of the median are dropped first, so a
 * hero with three games and a freak win rate can't top the list.
 */
export function tierSplit(stats: PositionStats): TierSplit {
  const rows = Object.entries(stats)
    .filter((entry): entry is [string, HeroStat] => !!entry[1])
    .map(([id, s]) => ({ id: Number(id), matches: s.matches_s, rank: s.rank }));

  const floor = median(rows.map((r) => r.matches)) * MEDIAN_FLOOR;
  const kept = rows.filter((r) => r.matches >= floor).sort((a, b) => b.rank - a.rank);
  return splitByShare(kept);
}

export const tierBuckets = (stats: PositionStats): number[][] => tierSplit(stats).buckets;

/** Cut an already rank-sorted list into the six tiers. */
export const splitRanked = (ranked: { id: number; rank: number }[]): TierSplit =>
  splitByShare(ranked);

/** "S 100–95, A 94–91, …" for the grid description. */
export function tierBreakpoints(ranges: TierSplit['ranges']): string {
  const round = (n: number) => Math.round(n);
  return ranges
    .map((r, i) => {
      const name = presetLabel(TIERS[i].preset).replace(/ Tier$/, '');
      return r ? `${name} ${round(r[0])}–${round(r[1])}` : `${name} —`;
    })
    .join(', ');
}

/**
 * Run a request against the local API, falling back to the deployed one.
 *
 * The local build is where the new endpoints live; everything else it serves is
 * the same data, so if it is simply not running the public API can answer.
 */
export async function withApiFallback<T>(fn: (base: string) => Promise<T>): Promise<T> {
  try {
    return await fn(LRG2_API);
  } catch {
    return await fn(LRG2_API_PUBLIC);
  }
}

/* ------------------------------------------------------------- tier lists */

/**
 * The report's own tier list: the same S..E buckets stats.spectral.gg shows,
 * already filtered and boosted for meta-level membership on the server. Heroes
 * below the pick floor come back under `not_meta` and are left off the grid.
 */
export interface TierListResult {
  tiers: Record<string, number[]>;
  ranges?: Record<string, { min: number; max: number }>;
}

export const tierListUrl = (report: string, position?: string, base = LRG2_API): string => {
  const mod = position ? `tierlists-position_${position}` : 'tierlists';
  return `${base}?league=${encodeURIComponent(report)}&mod=${mod}`;
};

/**
 * Fetch a tier list, or null when this report has none.
 *
 * The endpoint is new, so a deployment without it answers with an error rather
 * than data — which is a plain "no tier list here", not a failure worth
 * reporting. Callers fall back to ranking the positions themselves.
 */
export async function fetchTierList(
  report: string,
  position?: string,
  base?: string,
): Promise<TierListResult | null> {
  try {
    const res = await fetch(tierListUrl(report, position, base));
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: TierListResult; errors?: unknown[] };
    const tiers = body.result?.tiers;
    if (!tiers || !Object.keys(tiers).length) return null;
    // an empty list is the same as no list
    if (!TIERS.some((_, i) => (tiers[TIER_KEYS[i]] ?? []).length)) return null;
    return body.result ?? null;
  } catch {
    return null;
  }
}

/** Tier keys the API uses, best first — the order `TIERS` is in. */
export const TIER_KEYS = ['S', 'A', 'B', 'C', 'D', 'E'];

/** Turn the API's tier map into the bucket list the grid builders take. */
export function tierSplitFromApi(list: TierListResult): TierSplit {
  return {
    buckets: TIER_KEYS.map((k) => (list.tiers[k] ?? []).map(Number)),
    ranges: TIER_KEYS.map((k) => {
      const r = list.ranges?.[k];
      return r ? ([r.max, r.min] as [number, number]) : null;
    }),
  };
}

/* ---------------------------------------------------------- meta levels */

export interface MetaLayer {
  core: number[];
  combo: number[];
}

export interface MetaLevelsResult {
  layers: MetaLayer[];
  projections: (MetaLayer & { method?: string })[];
}

export const metaLevelsUrl = (report: string, base = LRG2_API): string =>
  `${base}?league=${encodeURIComponent(report)}&mod=meta_levels`;

/** The report's meta layers, or null when it can't produce them. */
export async function fetchMetaLevels(
  report: string,
  base?: string,
): Promise<MetaLevelsResult | null> {
  const res = await fetch(metaLevelsUrl(report, base));
  if (!res.ok) throw new Error(`Meta levels request failed (${res.status})`);
  const body = (await res.json()) as { result?: MetaLevelsResult };
  const layers = body.result?.layers;
  if (!layers?.length) return null;
  return { layers, projections: body.result?.projections ?? [] };
}

/** All five positions of a report, keyed by position code. */
export type ReportPositions = Record<string, PositionStats>;

interface RepeaterResult {
  results?: Record<string, Record<string, PositionStats>>;
}

export const positionsUrl = (report: string, base = LRG2_API): string =>
  `${base}?league=${encodeURIComponent(report)}&mod=heroes-positions-position_*`;

/**
 * Fetch every position of a report in one request. The repeater nests each
 * block under its own code twice (`results['1.2']['1.2']`), which is flattened
 * here so callers just index by role code.
 */
export async function fetchPositions(report: string, base?: string): Promise<ReportPositions> {
  const res = await fetch(positionsUrl(report, base));
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

/* ---------------------------------------------------------------- overall */

/** The per-hero fields read out of the report-wide pick/ban table. */
export interface PickbanStat {
  rank: number | string;
  picks_to_median: number | string;
  banrate: number | string;
}

/** How many heroes the recommended-bans block lists. */
export const BAN_COUNT = 10;

export interface OverallGroups {
  /** strongest heroes across all positions */
  meta: number[];
  /** most contested bans */
  bans: number[];
  /** the bottom of the ranked pool — heroes to leave alone this patch */
  avoid: number[];
}

export const pickbanUrl = (report: string, base = LRG2_API): string =>
  `${base}?league=${encodeURIComponent(report)}&mod=heroes/pickban`;

/**
 * Report-wide pick/ban numbers, used for the meta / bans / avoid blocks.
 * Unlike the positions report this one already carries `picks_to_median`, so
 * that is the pick-volume filter here.
 */
export async function fetchPickban(
  report: string,
  base?: string,
): Promise<Record<string, PickbanStat>> {
  const res = await fetch(pickbanUrl(report, base));
  if (!res.ok) throw new Error(`Pick/ban request failed (${res.status})`);
  const body = (await res.json()) as { result?: { pickban?: Record<string, PickbanStat> } };
  return body.result?.pickban ?? {};
}

/** Split the report-wide table into the three summary blocks. */
export function overallGroups(pickban: Record<string, PickbanStat>): OverallGroups {
  const rows = Object.entries(pickban).map(([id, s]) => ({
    id: Number(id),
    rank: Number(s.rank),
    picks: Number(s.picks_to_median),
    banrate: Number(s.banrate),
  }));

  const ranked = rows
    .filter((r) => r.picks >= MEDIAN_FLOOR && Number.isFinite(r.rank))
    .sort((a, b) => b.rank - a.rank);

  // the top two tier shares make a block wide enough to be worth a row
  const topShare = TIER_SHARES[0] + TIER_SHARES[1];
  const meta = ranked.slice(0, Math.round(ranked.length * topShare)).map((r) => r.id);
  const avoid = ranked
    .slice(Math.round(ranked.length * (1 - TIER_SHARES[TIER_COUNT - 1])))
    .map((r) => r.id);
  const bans = [...rows]
    .sort((a, b) => b.banrate - a.banrate)
    .slice(0, BAN_COUNT)
    .map((r) => r.id);

  return { meta, bans, avoid };
}

/* ----------------------------------------------------------------- grids */

const heroElements = (ids: number[], known: (id: number) => boolean): GridElement[] =>
  ids.filter(known).map((refId) => ({ kind: 'hero', refId }) as GridElement);

const width = (label: string): number => WIDENESS.findIndex((w) => w.label === label);

interface BoardOpts {
  columns: number;
  size: number;
  description: string;
}

/** Credited on every generated grid, so a shared one says where it came from. */
export const GENERATED_AUTHOR = 'Spectrebot - spectral.gg';

const baseBoard = (name: string, categories: Category[], opts: BoardOpts): Board => ({
  name,
  icon: 'rng',
  author: GENERATED_AUTHOR,
  description: opts.description,
  columns: opts.columns,
  portraitType: VERTICAL_PORTRAITS,
  itemStyle: 0,
  size: opts.size,
  colorfulLabels: true,
  centered: false,
  darkenedBg: true,
  categories,
});

/** Where a grid's tiers came from, named in its description. */
export type TierSource = 'tierlist' | 'ranking';

const SOURCE_NOTE: Record<TierSource, string> = {
  tierlist: "the report's tier lists",
  ranking: "the report's hero rankings",
};

/** `YYYY-MM-DD` for the grid name, so regenerating doesn't clobber yesterday's. */
export const stamp = (at: Date = new Date()): string => at.toISOString().slice(0, 10);

export const roleGridName = (role: RoleDef, report: ReportOption, at?: Date): string =>
  `${role.name} tiers — ${report.label} (${stamp(at)})`;

export const totalGridName = (report: ReportOption, at?: Date): string =>
  `Meta tiers — ${report.label} (${stamp(at)})`;

export const metaLevelsGridName = (report: ReportOption, at?: Date): string =>
  `Meta levels — ${report.label} (${stamp(at)})`;

export const overallGridName = (report: ReportOption, at?: Date): string =>
  `Tier list — ${report.label} (${stamp(at)})`;

/**
 * One role, one tier per row: six full-width categories labelled S..E Tier and
 * coloured by tier.
 */
export function buildRoleGrid(
  role: RoleDef,
  split: TierSplit,
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
  source: TierSource = 'ranking',
): Board {
  const categories = TIERS.map((tier, i) => ({
    id: `${role.code.replace('.', '')}-t${i}`,
    preset: tier.preset,
    color: tier.color,
    wideness: width('Full'),
    elements: heroElements(split.buckets[i] ?? [], known),
  }));
  return baseBoard(roleGridName(role, report, at), categories, {
    columns: 1,
    size: LARGE_SIZE,
    description:
      `${report.label} · from ${SOURCE_NOTE[source]}` +
      ` · hero rank per tier: ${tierBreakpoints(split.ranges)}`,
  });
}

/**
 * All five roles side by side: a column per role, a row per tier, with the
 * report-wide meta / bans block above and the heroes to avoid below.
 *
 * Each column is chained vertically and carries the role's colour. The top
 * category is the role name (which is also the S tier); the ones below it are
 * labelled by tier, so a column reads "Mid Lane, A, B, C, D, E".
 */
export function buildTotalGrid(
  byRole: Record<string, TierSplit>,
  overall: OverallGroups,
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
  source: TierSource = 'ranking',
): Board {
  const categories: Category[] = [
    {
      id: 'meta',
      preset: 29, // "Meta"
      color: 'purple',
      wideness: width('Two thirds'),
      elements: heroElements(overall.meta, known),
    },
    {
      id: 'bans',
      text: 'Bans',
      color: 'red',
      wideness: width('Third'),
      elements: heroElements(overall.bans, known),
    },
  ];

  // row-major, so the classic layout places tier 0 across the top
  for (let tier = 0; tier < TIER_COUNT; tier++) {
    for (const role of ROLES) {
      categories.push({
        id: `${role.code.replace('.', '')}-t${tier}`,
        preset: tier === 0 ? role.preset : TIERS[tier].preset,
        color: role.color,
        wideness: 0,
        vGroup: `col-${role.code}`,
        elements: heroElements(byRole[role.code]?.buckets[tier] ?? [], known),
      });
    }
  }

  categories.push({
    id: 'avoid',
    text: 'Not recommended',
    color: 'black',
    wideness: width('Full'),
    elements: heroElements(overall.avoid, known),
  });

  const breakpoints = ROLES.map(
    (r) => `${r.name}: ${tierBreakpoints(byRole[r.code]?.ranges ?? [])}`,
  ).join('\n');

  return baseBoard(totalGridName(report, at), categories, {
    columns: ROLES.length,
    size: MEDIUM_SIZE,
    description:
      `${report.label} · from ${SOURCE_NOTE[source]} · hero rank per tier —\n${breakpoints}`,
  });
}

/**
 * The report's meta layers, one row each: the heroes that define the layer and
 * the combo pieces that go with them. Layers run oldest first, the way the
 * report builds them, with any projected layers after the real ones.
 */
export function buildMetaLevelsGrid(
  levels: MetaLevelsResult,
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
): Board {
  const categories: Category[] = [];

  const row = (id: string, title: string, color: string, layer: MetaLayer) => {
    categories.push({
      id: `${id}-core`,
      text: title,
      color,
      wideness: width('Two thirds'),
      hGroup: id,
      elements: heroElements(layer.core, known),
    });
    categories.push({
      id: `${id}-combo`,
      text: `${title} combos`,
      color,
      wideness: width('Third'),
      hGroup: id,
      elements: heroElements(layer.combo ?? [], known),
    });
  };

  // the colour ladder doubles as a "how current is this" cue
  const shades = ['grey', 'teal', 'olive', 'yellow', 'orange', 'red'];
  levels.layers.forEach((layer, i) =>
    row(`meta${i}`, `Meta ${i}`, shades[Math.min(i, shades.length - 1)], layer),
  );
  levels.projections.forEach((p, i) =>
    row(`proj${i}`, `Projected${p.method ? ` (${p.method})` : ''}`, 'violet', p),
  );

  return baseBoard(metaLevelsGridName(report, at), categories, {
    columns: 2,
    size: MEDIUM_SIZE,
    description:
      `${report.label} · meta layers, oldest first. Each row is the heroes that` +
      ` define a layer and the combo pieces that go with them` +
      (levels.projections.length ? `, followed by the projected layers.` : `.`),
  });
}

/**
 * The whole roster in one tier list, no roles: six full-width rows, best first.
 */
export function buildOverallGrid(
  split: TierSplit,
  report: ReportOption,
  known: (id: number) => boolean,
  at?: Date,
  source: TierSource = 'ranking',
): Board {
  const categories = TIERS.map((tier, i) => ({
    id: `all-t${i}`,
    preset: tier.preset,
    color: tier.color,
    wideness: width('Full'),
    elements: heroElements(split.buckets[i] ?? [], known),
  }));
  return baseBoard(overallGridName(report, at), categories, {
    columns: 1,
    size: MEDIUM_SIZE,
    description:
      `${report.label} · every hero, from ${SOURCE_NOTE[source]}` +
      ` · hero rank per tier: ${tierBreakpoints(split.ranges)}`,
  });
}
