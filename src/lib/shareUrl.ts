import type { Board } from '../types/board';
import { encodeBoard } from './share';

/** Full shareable URL that opens the import page with the encoded board. */
export function buildShareUrl(board: Board): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/import?b=${encodeBoard(board)}`;
}
