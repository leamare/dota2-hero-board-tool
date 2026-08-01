import { describe, expect, it } from 'vitest';
import {
  MEDIAN_FLOOR,
  REPORTS,
  ROLES,
  TIERS,
  TIER_COUNT,
  buildRoleGrid,
  buildTotalGrid,
  overallGroups,
  positionsUrl,
  tierBreakpoints,
  tierBuckets,
  tierSplit,
  totalGridName,
  type PickbanStat,
  type PositionStats,
} from './autogrid';
import { boardLayout } from './layout';
import { presetLabel } from './constants';

/** A stand-in report: rank spread evenly, pick counts split around the median. */
const fixture = (): PositionStats => {
  const stats: PositionStats = {};
  // 20 popular heroes with ranks 100, 95, … 5
  for (let i = 0; i < 20; i++) stats[String(i + 1)] = { matches_s: 1000 - i, rank: 100 - i * 5 };
  // 20 rarely picked ones that must be filtered out, despite good ranks
  for (let i = 0; i < 20; i++) stats[String(100 + i)] = { matches_s: 10, rank: 90 - i };
  // a hole in the data, as the live report has for unplayed heroes
  stats['999'] = null;
  return stats;
};

const known = () => true;

/** Report-wide pick/ban rows; the live API sends these fields as strings. */
const pickbanFixture = (): Record<string, PickbanStat> => {
  const rows: Record<string, PickbanStat> = {};
  for (let i = 0; i < 25; i++) {
    rows[String(i + 1)] = {
      rank: String(100 - i * 4),
      picks_to_median: '1.5',
      // ban pressure runs the other way, so it can't just mirror rank
      banrate: String(0.01 * i),
    };
  }
  // rarely picked, so it stays out of the meta / avoid blocks entirely
  rows['900'] = { rank: '99', picks_to_median: '0.2', banrate: '0.001' };
  return rows;
};

describe('tierBuckets', () => {
  it('drops heroes below the median pick floor', () => {
    const buckets = tierBuckets(fixture());
    const ids = buckets.flat();
    expect(ids).toHaveLength(20);
    expect(ids.every((id) => id <= 20)).toBe(true);
  });

  it('splits the pool by tier share, best first', () => {
    const buckets = tierBuckets(fixture());
    expect(buckets).toHaveLength(TIER_COUNT);
    // 20 heroes against shares .08/.14/.20/.22/.18/.18, cut on rounded totals
    expect(buckets.map((b) => b.length)).toEqual([2, 2, 4, 5, 3, 4]);
    expect(buckets[0]).toEqual([1, 2]);
    // every band is contiguous and the whole pool is covered exactly once
    expect(buckets.flat()).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('reports the rank window of each tier', () => {
    const { ranges } = tierSplit(fixture());
    expect(ranges[0]).toEqual([100, 95]);
    expect(ranges[TIER_COUNT - 1]?.[1]).toBe(5);
    expect(tierBreakpoints(ranges)).toBe('S 100–95, A 90–85, B 80–65, C 60–40, D 35–25, E 20–5');
  });

  it('keeps heroes exactly on the floor', () => {
    const stats: PositionStats = {
      '1': { matches_s: 100, rank: 90 },
      '2': { matches_s: 100 * MEDIAN_FLOOR, rank: 50 },
      '3': { matches_s: 1, rank: 10 },
    };
    expect(tierBuckets(stats).flat()).toEqual([1, 2]);
  });

  it('survives an empty or tied report', () => {
    expect(tierBuckets({}).flat()).toEqual([]);
    const tied: PositionStats = {
      '1': { matches_s: 50, rank: 70 },
      '2': { matches_s: 50, rank: 70 },
    };
    // too few to fill every band, but nothing is lost or duplicated
    expect(tierBuckets(tied).flat()).toEqual([1, 2]);
  });
});

describe('overallGroups', () => {
  it('takes the meta off the top, the avoid block off the bottom, bans by ban rate', () => {
    const { meta, bans, avoid } = overallGroups(pickbanFixture());
    // 25 heroes clear the pick floor; meta is the top 22%, avoid the bottom 18%
    expect(meta).toEqual([1, 2, 3, 4, 5, 6]);
    expect(avoid).toEqual([22, 23, 24, 25]);
    // hero 900 is barely picked, so it appears in neither
    expect([...meta, ...avoid]).not.toContain(900);
    // highest ban rate first, unrelated to rank order
    expect(bans[0]).toBe(25);
    expect(bans).toHaveLength(10);
  });

  it('survives an empty table', () => {
    expect(overallGroups({})).toEqual({ meta: [], bans: [], avoid: [] });
  });
});

describe('grid building', () => {
  const report = REPORTS[0];
  const at = new Date('2026-08-01T12:00:00Z');
  const totalGrid = () =>
    buildTotalGrid(
      Object.fromEntries(ROLES.map((r) => [r.code, tierSplit(fixture())])),
      overallGroups(pickbanFixture()),
      report,
      known,
      at,
    );

  it('builds a role grid of six tier rows', () => {
    const grid = buildRoleGrid(ROLES[1], tierSplit(fixture()), report, known, at);
    expect(grid.columns).toBe(1);
    expect(grid.categories).toHaveLength(TIER_COUNT);
    expect(grid.categories.map((c) => c.color)).toEqual(TIERS.map((t) => t.color));
    expect(presetLabel(grid.categories[0].preset!)).toBe('S Tier');
    expect(grid.name).toBe('Mid Lane tiers — Ranked Meta (last week) (2026-08-01)');
    expect(grid.categories.flatMap((c) => c.elements)).toHaveLength(20);
    expect(grid.description).toContain('S 100–95');
  });

  it('builds a total grid as five vertical chains of six', () => {
    const grid = totalGrid();

    expect(grid.columns).toBe(ROLES.length);
    // the tier block, plus meta + bans on top and the avoid row underneath
    expect(grid.categories).toHaveLength(ROLES.length * TIER_COUNT + 3);
    expect(grid.name).toBe(totalGridName(report, at));

    for (const role of ROLES) {
      const column = grid.categories.filter((c) => c.vGroup === `col-${role.code}`);
      expect(column).toHaveLength(TIER_COUNT);
      expect(column.every((c) => c.color === role.color)).toBe(true);
      // the role name heads the column, the rest are labelled by tier
      expect(column[0].preset).toBe(role.preset);
      expect(column.slice(1).map((c) => c.preset)).toEqual(
        TIERS.slice(1).map((t) => t.preset),
      );
    }
  });

  it('lays the total grid out as a tier-per-row rectangle', () => {
    const grid = totalGrid();
    const placed = boardLayout(grid);
    const byId = new Map(placed.map((p) => [p.id, p]));

    expect(placed).toHaveLength(grid.categories.length);
    // meta and bans share the top row, the avoid row sits below everything
    expect(byId.get('meta')!.row).toBe(0);
    expect(byId.get('bans')!.row).toBe(0);
    expect(byId.get('meta')!.col).toBe(0);
    const tierRows = placed
      .filter((p) => p.id !== 'meta' && p.id !== 'bans' && p.id !== 'avoid')
      .map((p) => p.row);
    expect(Math.min(...tierRows)).toBeGreaterThan(0);
    expect(byId.get('avoid')!.row).toBeGreaterThan(Math.max(...tierRows));
    // one distinct column per role, one distinct row per tier
    const tierCols = placed
      .filter((p) => p.id !== 'meta' && p.id !== 'bans' && p.id !== 'avoid')
      .map((p) => p.col);
    expect(new Set(tierCols).size).toBe(ROLES.length);
    expect(new Set(tierRows).size).toBe(TIER_COUNT);
    // a role's categories all share one column
    for (const role of ROLES) {
      const ids = grid.categories
        .filter((c) => c.vGroup === `col-${role.code}`)
        .map((c) => c.id);
      const cols = new Set(placed.filter((p) => ids.includes(p.id)).map((p) => p.col));
      expect(cols.size).toBe(1);
    }
  });

  it('skips heroes the metadata does not know', () => {
    const grid = buildRoleGrid(ROLES[0], tierSplit(fixture()), report, (id) => id % 2 === 0, at);
    expect(grid.categories.flatMap((c) => c.elements)).toHaveLength(10);
  });
});

describe('positionsUrl', () => {
  it('asks for every position in one repeater request', () => {
    expect(positionsUrl('imm_ranked_meta_last_7')).toBe(
      'https://stats.spectral.gg/lrg2/api/?league=imm_ranked_meta_last_7&mod=heroes-positions-position_*',
    );
  });
});
