import type { Board } from '../types/board';
import { encodeBoard } from './share';

/** The portable text form of a grid: the compact base64 board code. */
export const gridCode = (board: Board): string => encodeBoard(board);

/** Strip characters that make for awkward file names. */
const safeName = (name: string): string =>
  (name.trim() || 'hero-grid').replace(/[^\w\-. ]+/g, '_').slice(0, 64);

function saveBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download plain text (used for base64 grid codes). */
export function downloadText(name: string, text: string): void {
  saveBlob(`${safeName(name)}.txt`, new Blob([text], { type: 'text/plain' }));
}

/** Download pretty-printed JSON. */
export function downloadJson(name: string, data: unknown): void {
  saveBlob(
    `${safeName(name)}.json`,
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
}

/** Download a data-URL image (used by the shareable image export). */
export function downloadDataUrl(name: string, dataUrl: string, ext = 'png'): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${safeName(name)}.${ext}`;
  a.click();
}
