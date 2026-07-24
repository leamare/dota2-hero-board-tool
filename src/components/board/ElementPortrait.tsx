import type { CSSProperties } from 'react';
import type { Board, Category, GridElement } from '../../types/board';
import { elementImageUrl, resolveDisplay } from '../../lib/board';
import { itemStyle } from '../../lib/images';
import { useMetadata } from '../../state/MetadataProvider';

interface Props {
  element: GridElement;
  category: Category;
  board: Board;
}

/**
 * One box on the grid. Every box in a category shares the same aspect and
 * height (from the category's portrait type + size); heroes fill the box,
 * items / custom icons are contained on a transparent background.
 */
export default function ElementPortrait({ element, category, board }: Props) {
  const meta = useMetadata();
  const { aspect, heightRem, style: styleId } = resolveDisplay(category, board);

  const style: CSSProperties = { aspectRatio: aspect, height: `${heightRem}rem` };

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
      {url && <img src={url} alt={title ?? ''} loading="lazy" />}
    </div>
  );
}
