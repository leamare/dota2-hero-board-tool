/** A Dota 2 hero as used across the grid. */
export interface Hero {
  id: number;
  /** short code used in image paths, e.g. "antimage" */
  tag: string;
  /** localized display name, e.g. "Anti-Mage" */
  name: string;
  /** alternate / lore name, e.g. "Magina" */
  alt?: string;
  /** search aliases (api + local overrides), lowercased */
  aliases: string[];
  /** alternate icon suffixes, e.g. ["persona1", "alt1"] */
  alticons: string[];
}

/** A Dota 2 item as used across the grid. */
export interface Item {
  id: number;
  /** short code used in image paths, e.g. "black_king_bar" */
  tag: string;
  /** prettified display name, e.g. "Black King Bar" */
  name: string;
}

/** Everything the app needs to render and search a board. */
export interface Metadata {
  heroes: Hero[];
  items: Item[];
  heroById: Map<number, Hero>;
  itemById: Map<number, Item>;
}
