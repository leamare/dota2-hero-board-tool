import { describe, expect, it } from 'vitest';
import {
  banHeroes,
  personalise,
  playerBaseline,
  practiceHeroes,
  ranksFromSplit,
  retier,
  roleWeights,
  signatureHeroes,
  type PlayerHeroes,
} from './personal';
import { TIER_COUNT } from './autogrid';

const player = (rows: [number, number, number, number?, number?][]): PlayerHeroes =>
  new Map(
    rows.map(([id, games, win, ag = 0, aw = 0]) => [
      id,
      { hero_id: id, games, win, against_games: ag, against_win: aw },
    ]),
  );

describe('ranksFromSplit', () => {
  it('walks each tier window so the report order survives', () => {
    const ranks = ranksFromSplit({
      buckets: [[1, 2, 3], [4], [], [], [], []],
      ranges: [[100, 90], [80, 80], null, null, null, null],
    });
    expect(ranks.get(1)).toBe(100);
    expect(ranks.get(2)).toBe(95);
    expect(ranks.get(3)).toBe(90);
    expect(ranks.get(4)).toBe(80);
  });

  it('falls back to an even ladder when a tier reports no window', () => {
    const ranks = ranksFromSplit({ buckets: [[1, 2], [], [], [], [], []], ranges: [null, null, null, null, null, null] });
    expect(ranks.get(1)).toBe(100);
    expect(ranks.get(2)).toBeCloseTo(100 - 100 / TIER_COUNT, 5);
  });
});

describe('personalise', () => {
  const ranks = new Map([[1, 60], [2, 60], [3, 60]]);

  it('rewards a deep hero pool, but only while the record holds up', () => {
    // same win rate, wildly different mileage
    const heroes = player([[1, 400, 240], [2, 30, 18]]);
    const scored = personalise(new Map([[1, 60], [2, 60]]), heroes);
    expect(scored[0].id).toBe(1);

    // hundreds of games on a hero they lose on earns nothing
    const losing = player([[1, 400, 120], [2, 400, 260]]);
    const bad = personalise(new Map([[1, 60], [2, 60]]), losing);
    expect(bad.find((h) => h.id === 1)!.shift).toBeLessThan(0);
  });

  it('discounts an unplayed hero unless the report rates it near the top', () => {
    const heroes = player([[9, 100, 50]]);
    const scored = personalise(new Map([[1, 100], [2, 50]]), heroes);
    const top = scored.find((h) => h.id === 1)!;
    const mid = scored.find((h) => h.id === 2)!;
    // neither is played: the strong one keeps its rank, the middling one drops
    expect(top.shift).toBe(0);
    expect(mid.shift).toBeLessThan(-5);
  });

  it('lifts a hero the player wins on and drops one they lose on', () => {
    // baseline is 50%: hero 1 well above it, hero 3 well below
    const heroes = player([[1, 50, 40], [2, 50, 25], [3, 50, 10]]);
    const [best, , worst] = personalise(ranks, heroes);
    expect(best.id).toBe(1);
    expect(worst.id).toBe(3);
    expect(best.shift).toBeGreaterThan(0);
    expect(worst.shift).toBeLessThan(0);
  });

  it('barely moves a hero with only a couple of games', () => {
    const heroes = player([[1, 2, 2], [2, 50, 25]]);
    const scored = personalise(new Map([[1, 60], [2, 60]]), heroes);
    const one = scored.find((h) => h.id === 1)!;
    expect(Math.abs(one.shift)).toBeLessThan(3);
  });

  it('measures form against the player, not against 50%', () => {
    // a 60% player: the 55% hero is below their own bar, the 70% one above,
    // even though both are winning records in absolute terms
    const heroes = player([[1, 100, 55], [2, 100, 70], [3, 800, 484]]);
    expect(playerBaseline(heroes)).toBeGreaterThan(0.55);
    const scored = personalise(new Map([[1, 60], [2, 60]]), heroes);
    const [above, below] = scored;
    expect(above.id).toBe(2);
    expect(below.id).toBe(1);
    expect(above.score).toBeGreaterThan(below.score);
  });
});

describe('signatureHeroes', () => {
  it('picks the handful that stand out', () => {
    const heroes = player([
      [1, 400, 260], [2, 380, 240], [3, 350, 220],
      ...Array.from({ length: 20 }, (_, i) => [10 + i, 20, 10] as [number, number, number]),
    ]);
    expect(signatureHeroes(heroes)).toEqual([1, 2, 3]);
  });

  it('falls back to a top few when nothing stands out', () => {
    const heroes = player(Array.from({ length: 10 }, (_, i) => [i + 1, 40, 24] as [number, number, number]));
    expect(signatureHeroes(heroes)).toHaveLength(3);
  });

  it('ignores heroes the player loses on, however many games', () => {
    const heroes = player([[1, 500, 100], [2, 40, 30], [3, 40, 29], [4, 40, 28]]);
    expect(signatureHeroes(heroes)).not.toContain(1);
  });

  it('returns nothing for an unplayed account', () => {
    expect(signatureHeroes(player([[1, 2, 1]]))).toEqual([]);
  });
});

describe('practiceHeroes', () => {
  it('takes strong heroes the player has hardly touched', () => {
    const heroes = player([[1, 300, 180], [2, 3, 2]]);
    const scored = personalise(new Map([[1, 90], [2, 88], [3, 86]]), heroes);
    // 1 is excluded as a signature pick, 2 and 3 are barely played
    expect(practiceHeroes(scored, new Set([1]))).toEqual([2, 3]);
  });

  it('tops up from the least-played heroes when nothing is untouched', () => {
    const heroes = player([[1, 300, 150], [2, 200, 100], [3, 50, 25]]);
    const scored = personalise(new Map([[1, 90], [2, 80], [3, 70]]), heroes);
    // every hero is well past the "untouched" bar, so the block relaxes
    expect(practiceHeroes(scored, new Set(), 2)).toEqual([2, 3]);
  });
});

describe('banHeroes', () => {
  it('lists the heroes with the best record against the player', () => {
    const heroes = player([
      [1, 10, 5, 100, 60],
      [2, 10, 5, 100, 40],
      [3, 10, 5, 5, 0], // too few games faced to mean anything
    ]);
    expect(banHeroes(heroes)).toEqual([2, 1]);
  });
});

describe('roleWeights', () => {
  it('weighs a role by the games played on its heroes', () => {
    const byRole = {
      '1.1': { buckets: [[1, 2], [], [], [], [], []], ranges: [] },
      '1.2': { buckets: [[3], [], [], [], [], []], ranges: [] },
    };
    const heroes = player([[1, 10, 5], [2, 20, 10], [3, 5, 2]]);
    const w = roleWeights(byRole as never, heroes);
    expect(w['1.1']).toBe(30);
    expect(w['1.2']).toBe(5);
  });
});

describe('retier', () => {
  it('re-cuts a personalised ranking into six tiers, best first', () => {
    const scored = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1, base: 100 - i, shift: 0, score: 100 - i, games: 0, winrate: 0,
    }));
    const split = retier(scored);
    expect(split.buckets).toHaveLength(TIER_COUNT);
    expect(split.buckets.flat()).toHaveLength(60);
    expect(split.buckets[0][0]).toBe(1);
  });
});
