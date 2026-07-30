import type { CSSProperties } from 'react';
import type { Board, Category, GridElement } from '../../types/board';
import { elementImageUrl, resolveDisplay } from '../../lib/board';
import { itemStyle } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';

interface Props {
  element: GridElement;
  category: Category;
  board: Board;
  /** explicit portrait height in px — canvas mode fits portraits to the box */
  sizePx?: number;
}

/**
 * One box on the grid. Every box in a category shares the same aspect and
 * height (from the category's portrait type + size, or a fitted px height on
 * the canvas); heroes fill the box, items / custom icons are contained on a
 * transparent background.
 */
export default function ElementPortrait({ element, category, board, sizePx }: Props) {
  const meta = useMetadata();
  const { aspect, heightRem, style: styleId } = resolveDisplay(category, board);

  const style: CSSProperties = {
    aspectRatio: aspect,
    height: sizePx !== undefined ? `${sizePx}px` : `${heightRem}rem`,
  };

  // a break forces the following portraits onto a new line inside the category
  if (element.kind === 'break') {
    return <div className="portrait-break" />;
  }

  if (element.kind === 'empty') {
    return <div className="portrait empty" style={style} />;
  }

  const url = meta ? elementImageUrl(element, category, board, meta) : null;
  const contain = element.kind === 'item' || element.kind === 'custom';
  // profile badges have lots of transparent padding — scale them up a touch
  const badge = contain && itemStyle(styleId).key === 'profile_badges';
  const ref =
    element.kind === 'item'
      ? element.refId != null
        ? meta?.itemById.get(element.refId)
        : undefined
      : element.refId != null
        ? meta?.heroById.get(element.refId)
        : undefined;
  const title = ref?.name ?? element.tag ?? undefined;

  return (
    <div
      className={`portrait${contain ? ' contain' : ''}${badge ? ' badge' : ''}`}
      style={style}
      title={title}
    >
      {/* eager + async: board portraits are few and shared across view/edit, so
          they resolve instantly from cache instead of re-fetching on route change */}
      {url && <img src={url} alt={title ?? ''} decoding="async" />}
    </div>
  );
}
