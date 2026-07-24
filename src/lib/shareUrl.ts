import type { Board } from '../types/board';
import { encodeBoard } from './share';

/** Full shareable URL that opens the import page with the encoded board. */
export function buildShareUrl(board: Board): string {
  const { origin } = window.location;
  return `${origin}/import?b=${encodeBoard(board)}`;
}
