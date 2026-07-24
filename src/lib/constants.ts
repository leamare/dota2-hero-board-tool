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

/** Width presets. `basis` is the flex-basis percentage a category occupies. */
export const WIDENESS: { label: string; basis: number }[] = [
  { label: 'Default', basis: 100 / 3 },
  { label: 'Full', basis: 100 },
  { label: 'Half', basis: 50 },
  { label: 'Third', basis: 100 / 3 },
  { label: 'Fourth', basis: 25 },
  { label: 'Two thirds', basis: 200 / 3 },
  { label: 'Three fourths', basis: 75 },
];

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
];

export const presetLabel = (value: number): string =>
  PRESET_NAMES.find((p) => p.value === value)?.label ?? '';

export const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

export const MAX_COLUMNS = 6;
