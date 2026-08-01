import { describe, expect, it } from 'vitest';
import {
  MEDIAN_FLOOR,
  REPORTS,
  ROLES,
  TIERS,
  TIER_COUNT,
  buildRoleGrid,
  buildTotalGrid,
  positionsUrl,
  tierBuckets,
  totalGridName,
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

describe('tierBuckets', () => {
  it('drops heroes below the median pick floor', () => {
    const buckets = tierBuckets(fixture());
    const ids = buckets.flat();
    expect(ids).toHaveLength(20);
    expect(ids.every((id) => id <= 20)).toBe(true);
  });

  it('cuts the surviving rank span into six equal bands', () => {
    const buckets = tierBuckets(fixture());
    expect(buckets).toHaveLength(TIER_COUNT);
    // ranks run 100 down to 5, so each band is 15.83 wide
    expect(buckets[0]).toEqual([1, 2, 3, 4]); // 100..85
    expect(buckets[TIER_COUNT - 1][buckets[TIER_COUNT - 1].length - 1]).toBe(20);
    // every band is contiguous and the whole pool is covered exactly once
    expect(buckets.flat()).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
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
    expect(tierBuckets(tied)[0]).toEqual([1, 2]);
  });
});

describe('grid building', () => {
  const report = REPORTS[0];
  const at = new Date('2026-08-01T12:00:00Z');

  it('builds a role grid of six tier rows', () => {
    const grid = buildRoleGrid(ROLES[1], tierBuckets(fixture()), report, known, at);
    expect(grid.columns).toBe(1);
    expect(grid.categories).toHaveLength(TIER_COUNT);
    expect(grid.categories.map((c) => c.color)).toEqual(TIERS.map((t) => t.color));
    expect(presetLabel(grid.categories[0].preset!)).toBe('S Tier');
    expect(grid.name).toBe('Mid Lane tiers — Ranked Meta (last week) (2026-08-01)');
    expect(grid.categories.flatMap((c) => c.elements)).toHaveLength(20);
  });

  it('builds a total grid as five vertical chains of six', () => {
    const byRole = Object.fromEntries(ROLES.map((r) => [r.code, tierBuckets(fixture())]));
    const grid = buildTotalGrid(byRole, report, known, at);

    expect(grid.columns).toBe(ROLES.length);
    expect(grid.categories).toHaveLength(ROLES.length * TIER_COUNT);
    expect(grid.name).toBe(totalGridName(report, at));

    for (const role of ROLES) {
      const column = grid.categories.filter((c) => c.vGroup === `col-${role.code}`);
      expect(column).toHaveLength(TIER_COUNT);
      expect(column.every((c) => c.color === role.color)).toBe(true);
      // the role name appears once, at the top of the column
      expect(column.filter((c) => c.preset !== undefined)).toHaveLength(1);
      expect(column[0].preset).toBe(role.preset);
    }
  });

  it('lays the total grid out as a tier-per-row rectangle', () => {
    const byRole = Object.fromEntries(ROLES.map((r) => [r.code, tierBuckets(fixture())]));
    const grid = buildTotalGrid(byRole, report, known, at);
    const placed = boardLayout(grid);

    expect(placed).toHaveLength(ROLES.length * TIER_COUNT);
    // one distinct column per role, one distinct row per tier
    expect(new Set(placed.map((p) => p.col)).size).toBe(ROLES.length);
    expect(new Set(placed.map((p) => p.row)).size).toBe(TIER_COUNT);
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
    const grid = buildRoleGrid(ROLES[0], tierBuckets(fixture()), report, (id) => id % 2 === 0, at);
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
