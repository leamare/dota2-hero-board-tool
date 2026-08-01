/** Label colours. Keys map to --label-* css variables and to the binary encoder. */
export const LABEL_COLORS: { key: string; label: string }[] = [
  { key: '', label: 'None' },
  { key: 'red', label: 'Red' },
  { key: 'orange', label: 'Orange' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'olive', label: 'Olive' },
  { key: 'green', label: 'Green' },
  { key: 'teal', label: 'Teal' },
  { key: 'blue', label: 'Blue' },
  { key: 'violet', label: 'Violet' },
  { key: 'purple', label: 'Purple' },
  { key: 'pink', label: 'Pink' },
  { key: 'brown', label: 'Brown' },
  { key: 'grey', label: 'Grey' },
  { key: 'black', label: 'Black' },
];

export const colorIndex = (key: string): number => {
  const i = LABEL_COLORS.findIndex((c) => c.key === key);
  return i < 0 ? 0 : i;
};

/**
 * Width presets. `basis` is the percentage of the board a category occupies.
 *
 * The index is persisted (share codes, saved grids), so new presets are
 * appended and `WIDENESS_OPTIONS` holds the order menus show them in.
 */
export const WIDENESS: { label: string; basis: number; fill?: boolean }[] = [
  { label: 'Default', basis: 100 / 3 },
  { label: 'Full', basis: 100 },
  { label: 'Half', basis: 50 },
  { label: 'Third', basis: 100 / 3 },
  { label: 'Fourth', basis: 25 },
  { label: 'Two thirds', basis: 200 / 3 },
  { label: 'Three fourths', basis: 75 },
  // stretches to whatever is left in its row — handy for the last category
  { label: 'Remaining space', basis: 100, fill: true },
  { label: 'Sixth', basis: 100 / 6 },
  { label: 'Eighth', basis: 12.5 },
];

/** Index of the "stretch to the end of the row" width. */
export const WIDENESS_FILL = WIDENESS.findIndex((w) => w.fill);

/** Menu order — widest first, with the two open-ended options at the ends. */
export const WIDENESS_OPTIONS: number[] = [0, 1, 6, 5, 2, 3, 4, 8, 9, 7];

/**
 * Preset name with the share of the board it takes, so picking a width doesn't
 * mean translating "Two thirds" into a number in your head. "Default" follows
 * the grid's column count, so its share depends on the board.
 */
export function widenessLabel(index: number, columns?: number): string {
  const preset = WIDENESS[index];
  if (!preset) return '';
  if (preset.fill) return preset.label;
  if (index === 0) {
    return columns ? `${preset.label} (${Math.round(100 / columns)}%)` : preset.label;
  }
  return `${preset.label} (${Math.round(preset.basis)}%)`;
}

/** Preset category names, carried over from the original tool. */
export const PRESET_NAMES: { value: number; label: string }[] = [
  { value: 1, label: 'Empty' },
  { value: 2, label: 'Safe Lane' },
  { value: 3, label: 'Mid Lane' },
  { value: 4, label: 'Off Lane' },
  { value: 5, label: 'Position 4' },
  { value: 6, label: 'Position 5' },
  { value: 7, label: 'Mixed' },
  { value: 8, label: 'Greedy' },
  { value: 9, label: 'Pushers' },
  { value: 10, label: 'Aggressive' },
  { value: 11, label: 'Passive' },
  { value: 12, label: 'No Stuns' },
  { value: 13, label: 'Roamers' },
  { value: 14, label: 'Squishy' },
  { value: 15, label: 'Nukers' },
  { value: 16, label: 'Stunners' },
  { value: 17, label: 'Tanky' },
  { value: 18, label: 'Escape' },
  { value: 19, label: 'Initiators' },
  { value: 20, label: 'Complex' },
  { value: 21, label: 'First Pick' },
  { value: 22, label: 'Cores' },
  { value: 23, label: 'Supports' },
  { value: 24, label: 'Melee' },
  { value: 25, label: 'Ranged' },
  { value: 26, label: 'Solo Lane' },
  { value: 27, label: 'Duo Lane' },
  { value: 28, label: 'Trilane' },
  { value: 29, label: 'Meta' },
  { value: 30, label: 'Early Game' },
  { value: 31, label: 'Mid Game' },
  { value: 32, label: 'Late Game' },
  { value: 33, label: 'Situational' },
  { value: 34, label: 'Support' },
  { value: 35, label: 'Hard Support' },
  { value: 36, label: 'S Tier' },
  { value: 37, label: 'A Tier' },
  { value: 38, label: 'B Tier' },
  { value: 39, label: 'C Tier' },
  { value: 40, label: 'D Tier' },
  { value: 41, label: 'E Tier' },
  { value: 42, label: 'F Tier' },
  { value: 43, label: 'Shit Tier' },
];

export const presetLabel = (value: number): string =>
  PRESET_NAMES.find((p) => p.value === value)?.label ?? '';

export const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

export const MAX_COLUMNS = 6;

/** Dota facet icons available at courier `facets/<name>.png` (from the LRG2 facets metadata). */
export const FACET_ICONS = [
  'aghs', 'agility', 'arc_warden', 'arc_warden_alt', 'area_of_effect', 'armor', 'armor_broken',
  'barrier', 'broken_chain', 'brush', 'bubbles', 'chicken', 'chrono_cube', 'cooldown', 'curve_ball',
  'damage', 'dawnbreaker_hammer', 'death_ward', 'debuff', 'double_bounce', 'dragon_fire',
  'dragon_frost', 'dragon_poison', 'empower', 'execute', 'fence', 'fist', 'focus_fire', 'full_heart',
  'gold', 'healing', 'illusion', 'invoker_exort', 'invoker_quas', 'invoker_wex', 'item', 'kez_flutter',
  'kez_shadowhawk', 'lifestealer_rage', 'mana', 'meat', 'moon', 'movement', 'multi_arrow', 'no_facet',
  'no_vision', 'nuke', 'ogre', 'overshadow', 'phantom_ass_dagger', 'phantom_lance', 'pie', 'pudge_hook',
  'range', 'ricochet', 'rng', 'rune', 'siege', 'silencer', 'skull', 'slow', 'snake', 'snot', 'snowflake',
  'spectre', 'speed', 'spinning', 'spirit', 'strength', 'summons', 'sun', 'teleport', 'tower', 'tree',
  'twin_hearts', 'vision', 'vortex_in', 'vortex_out', 'web', 'whoopee_cushion', 'wolf', 'xp',
];

/** Fallback facet icon used wherever a grid has none set. */
export const DEFAULT_GRID_ICON = 'item';
