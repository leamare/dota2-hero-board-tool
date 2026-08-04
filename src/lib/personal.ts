import { OPENDOTA_API } from './config';
import { WIDENESS } from './constants';
import { SIZES, VERTICAL_PORTRAITS } from './images';
import {
  GENERATED_AUTHOR,
  ROLES,
  TIER_COUNT,
  TIER_SHARES,
  stamp,
  type ReportOption,
  type RoleDef,
  type TierSource,
  type TierSplit,
} from './autogrid';
import type { Board, Category, GridElement } from '../types/board';

/*
 * Personalised tier lists.
 *
 * The report's tier lists say how good a hero is right now; OpenDota says how
 * well *you* play it. This module folds the second into the first, so a hero
 * you are strong on climbs and one you keep losing on drops, and then carves
 * out the blocks a personal grid actually wants: the heroes you are known for,
 * the meta heroes you haven't touched, and the ones you hate to face.
 */

/** One hero's record for a player, as OpenDota reports it. */
export interface PlayerHero {
  hero_id: number;
  games: number;
  win: number;
  against_games: number;
  against_win: number;
}

export type PlayerHeroes = Map<number, PlayerHero>;

/** Games on a hero at which the player's record counts for full weight. */
export const GAMES_FOR_TRUST = 25;
/** Rank points a hero moves at a full-weight ±100% win rate swing. */
export const FORM_SWING = 60;
/**
 * Rank points for simply knowing a hero well, at full weight. Deliberately
 * small next to `FORM_SWING`: time on a hero is worth something, but it
 * shouldn't outrank actually winning on it.
 */
export const FAMILIARITY = 4;
/** Fewest games before a hero can be called a signature pick. */
export const SIGNATURE_MIN_GAMES = 15;
/** Signature list size when nothing stands out on its own. */
export const SIGNATURE_FALLBACK = 3;
export const SIGNATURE_MAX = 8;
/** Most games on a hero that still counts as "worth practising". */
export const PRACTICE_MAX_GAMES = 10;
export const PRACTICE_SIZE = 9;
/** Games faced before a hero's record against the player means anything. */
export const BAN_MIN_FACED = 15;
export const BAN_SIZE = 7;
/** Heroes listed per role. */
export const ROLE_SIZE = 12;

export const playerHeroesUrl = (accountId: string | number): string =>
  `${OPENDOTA_API}/players/${encodeURIComponent(String(accountId))}/heroes`;

/** Fetch a player's per-hero record. Throws when the profile can't be read. */
export async function fetchPlayerHeroes(accountId: string | number): Promise<PlayerHeroes> {
  const res = await fetch(playerHeroesUrl(accountId));
  if (!res.ok) throw new Error(`OpenDota request failed (${res.status})`);
  const rows = (await res.json()) as PlayerHero[];
  if (!Array.isArray(rows)) throw new Error('OpenDota returned no hero records');
  const played = rows.filter((r) => Number(r.games) > 0);
  if (!played.length) throw new Error('That account has no public match history');
  return new Map(played.map((r) => [Number(r.hero_id), r]));
}

/** The player's win rate across everything they play — their own baseline. */
export function playerBaseline(heroes: PlayerHeroes): number {
  let games = 0;
  let wins = 0;
  for (const h of heroes.values()) {
    games += Number(h.games);
    wins += Number(h.win);
  }
  return games ? wins / games : 0.5;
}

/** A hero's rank once the player's record on it is folded in. */
export interface ScoredHero {
  id: number;
  /** the report's own rank, 0..100 */
  base: number;
  /** what the player's record added or took away */
  shift: number;
  score: number;
  games: number;
  winrate: number;
}

/**
 * Spread a tier list back out into per-hero ranks.
 *
 * The API hands back buckets plus the rank window each covers, so a hero's
 * position inside its bucket can be recovered by walking the window — that
 * keeps the ordering the report already decided instead of flattening every
 * hero in a tier to one number.
 */
export function ranksFromSplit(split: TierSplit): Map<number, number> {
  const out = new Map<number, number>();
  for (let t = 0; t < TIER_COUNT; t++) {
    const bucket = split.buckets[t] ?? [];
    if (!bucket.length) continue;
    const range = split.ranges[t];
    // no window reported: fall back to an even ladder over the tier's slot
    const hi = range ? range[0] : 100 - (t * 100) / TIER_COUNT;
    const lo = range ? range[1] : 100 - ((t + 1) * 100) / TIER_COUNT;
    const step = bucket.length > 1 ? (hi - lo) / (bucket.length - 1) : 0;
    bucket.forEach((id, i) => out.set(id, hi - step * i));
  }
  return out;
}

/**
 * Fold the player's record into a set of ranks.
 *
 * Two things move a hero: how they do on it compared with their own overall win
 * rate, and how much they have played it at all. Both are damped by games
 * played, so one lucky evening can't promote a hero and a hero with two games
 * barely moves.
 */
export function personalise(
  ranks: Map<number, number>,
  heroes: PlayerHeroes,
  baseline = playerBaseline(heroes),
): ScoredHero[] {
  const out: ScoredHero[] = [];
  for (const [id, base] of ranks) {
    const rec = heroes.get(id);
    const games = Number(rec?.games ?? 0);
    const winrate = games ? Number(rec!.win) / games : 0;
    const trust = Math.min(1, games / GAMES_FOR_TRUST);
    const form = games ? (winrate - baseline) * FORM_SWING * trust : 0;
    const known = trust * FAMILIARITY;
    const shift = form + known;
    out.push({ id, base, shift, score: base + shift, games, winrate });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Re-cut a personalised ranking into the same six tiers. */
export function retier(scored: ScoredHero[]): TierSplit {
  const buckets: number[][] = [];
  const ranges: ([number, number] | null)[] = [];
  let at = 0;
  let acc = 0;
  for (let t = 0; t < TIER_COUNT; t++) {
    acc += TIER_SHARES[t];
    const end = t === TIER_COUNT - 1 ? scored.length : Math.round(scored.length * acc);
    const band = scored.slice(at, Math.max(at, end));
    at = Math.max(at, end);
    buckets.push(band.map((h) => h.id));
    ranges.push(band.length ? [band[0].score, band[band.length - 1].score] : null);
  }
  return { buckets, ranges };
}

/**
 * The heroes the player is known for: enough games to mean something, and a win
 * rate clearly above their own average.
 *
 * "Clearly" is a standard deviation above the mean of the candidates, so a
 * player with five obvious mains gets five and one with a flat spread gets the
 * fallback few rather than an arbitrary cut.
 */
export function signatureHeroes(heroes: PlayerHeroes, baseline = playerBaseline(heroes)): number[] {
  const played = [...heroes.values()].filter((h) => Number(h.games) >= SIGNATURE_MIN_GAMES);
  if (!played.length) return [];

  // games carry the weight here: a signature hero is one you have actually put
  // the time into, with the win rate confirming it rather than driving it
  const rated = played
    .map((h) => {
      const games = Number(h.games);
      const edge = Number(h.win) / games - baseline;
      return { id: Number(h.hero_id), score: Math.sqrt(games) * (1 + edge * 4), games, edge };
    })
    .sort((a, b) => b.score - a.score);

  // heroes they actually win on, if there are any — otherwise everything they
  // play a lot, so an account with a flat record still gets a top few
  const winners = rated.filter((h) => h.edge > 0);
  const pool = winners.length ? winners : rated;

  const mean = pool.reduce((sum, h) => sum + h.score, 0) / pool.length;
  const sd = Math.sqrt(pool.reduce((sum, h) => sum + (h.score - mean) ** 2, 0) / pool.length);
  // a flat spread has no outliers to find — everything sits a hair above the
  // mean and "one sd up" would hand back the whole pool
  const standout = sd / (mean || 1) > 0.05 ? pool.filter((h) => h.score >= mean + sd) : [];
  const picked = standout.length >= SIGNATURE_FALLBACK ? standout : pool.slice(0, SIGNATURE_FALLBACK);
  return picked.slice(0, SIGNATURE_MAX).map((h) => h.id);
}

/** Strong heroes the player has barely touched — worth learning. */
export function practiceHeroes(
  scored: ScoredHero[],
  exclude: Set<number>,
  size = PRACTICE_SIZE,
): number[] {
  // rank by the report's own view throughout: the player's record on a hero
  // they barely touch is too thin to say anything
  const eligible = scored.filter((h) => !exclude.has(h.id)).sort((a, b) => b.base - a.base);
  const fresh = eligible.filter((h) => h.games <= PRACTICE_MAX_GAMES);
  if (fresh.length >= size) return fresh.slice(0, size).map((h) => h.id);

  /*
   * Someone who has played everything has no untouched heroes, and an empty
   * block is less useful than a loose one — top up with the strong heroes they
   * play least, which is the same idea with the bar moved.
   */
  const rest = eligible
    .filter((h) => h.games > PRACTICE_MAX_GAMES)
    .sort((a, b) => a.games - b.games || b.base - a.base)
    .slice(0, size - fresh.length);
  return [...fresh, ...rest].sort((a, b) => b.base - a.base).slice(0, size).map((h) => h.id);
}

/** The heroes with the best record *against* this player. */
export function banHeroes(heroes: PlayerHeroes, size = BAN_SIZE): number[] {
  return [...heroes.values()]
    .filter((h) => Number(h.against_games) >= BAN_MIN_FACED)
    .map((h) => ({
      id: Number(h.hero_id),
      // their win rate against the player, so lowest is worst for the player
      wr: Number(h.against_win) / Number(h.against_games),
    }))
    .sort((a, b) => a.wr - b.wr)
    .slice(0, size)
    .map((h) => h.id);
}

/** How much the player plays each role, judged by their games on its heroes. */
export function roleWeights(
  byRole: Record<string, TierSplit>,
  heroes: PlayerHeroes,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const role of ROLES) {
    const ids = (byRole[role.code]?.buckets ?? []).flat();
    out[role.code] = ids.reduce((sum, id) => sum + Number(heroes.get(id)?.games ?? 0), 0);
  }
  return out;
}

const width = (label: string): number => WIDENESS.findIndex((w) => w.label === label);
const autoSize = SIZES.findIndex((s) => s.auto);
const largeSize = SIZES.findIndex((s) => s.label === 'Large');

const heroElements = (ids: number[], known: (id: number) => boolean): GridElement[] =>
  ids.filter(known).map((refId) => ({ kind: 'hero', refId }) as GridElement);

export const personalGridName = (accountId: string | number, at?: Date): string =>
  `My tier list — ${accountId} (${stamp(at)})`;

export interface PersonalGridInput {
  accountId: string | number;
  report: ReportOption;
  heroes: PlayerHeroes;
  /** the report's overall list, already personalised */
  overall: ScoredHero[];
  /** per role, personalised and re-tiered */
  byRole: Record<string, TierSplit>;
  source: TierSource;
  /** order roles by how much the player plays them instead of by position */
  sortRoles?: boolean;
}

/**
 * The personal grid: signature heroes and a practice list on top, the heroes
 * that beat this player next to them, then one block per role of the best
 * picks for them specifically.
 */
export function buildPersonalGrid(
  input: PersonalGridInput,
  known: (id: number) => boolean,
  at?: Date,
): Board {
  const { accountId, report, heroes, overall, byRole, source, sortRoles } = input;

  const signature = signatureHeroes(heroes);
  const practice = practiceHeroes(overall, new Set(signature));
  const bans = banHeroes(heroes);

  const categories: Category[] = [
    {
      id: 'signature',
      text: 'Best heroes',
      color: 'olive',
      wideness: 0,
      // few heroes in a narrow column: let them fill it
      size: autoSize,
      elements: heroElements(signature, known),
    },
    {
      id: 'practice',
      text: 'Practice',
      color: 'teal',
      wideness: width('Two thirds'),
      elements: heroElements(practice, known),
    },
    {
      id: 'bans',
      text: 'Bans',
      color: 'red',
      wideness: width('Full'),
      elements: heroElements(bans, known),
    },
  ];

  const order = sortRoles
    ? [...ROLES].sort((a, b) => {
        const w = roleWeights(byRole, heroes);
        return (w[b.code] ?? 0) - (w[a.code] ?? 0);
      })
    : ROLES;

  for (const role of order) {
    categories.push({
      id: `role-${role.code.replace('.', '')}`,
      preset: role.preset,
      color: role.color,
      wideness: 0,
      elements: heroElements(
        (byRole[role.code]?.buckets ?? []).flat().slice(0, ROLE_SIZE),
        known,
      ),
    });
  }

  return {
    name: personalGridName(accountId, at),
    icon: 'rng',
    author: GENERATED_AUTHOR,
    description:
      `${report.label} · from ${source === 'tierlist' ? "the report's tier lists" : "the report's hero rankings"},` +
      ` adjusted by account ${accountId}'s record on each hero.` +
      ` Heroes run best-first within every block.`,
    columns: 3,
    portraitType: VERTICAL_PORTRAITS,
    itemStyle: 0,
    size: largeSize,
    colorfulLabels: true,
    centered: false,
    darkenedBg: true,
    categories,
  };
}

/** Role definitions, re-exported so the panel doesn't import two modules. */
export type { RoleDef };
