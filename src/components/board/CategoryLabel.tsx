import { heroImageUrl, imageUrl, itemImageUrl } from '../../lib/images';
import { presetLabel } from '../../lib/constants';
import type { Category, CategoryIcon } from '../../types/board';
import { useMetadata } from '../../state/MetadataProvider';

function IconImg({ icon }: { icon: CategoryIcon }) {
  const meta = useMetadata();
  switch (icon.kind) {
    case 'hero': {
      const hero = icon.refId != null ? meta?.heroById.get(icon.refId) : undefined;
      if (!hero) return null;
      return (
        <img
          className="cat-title-icon"
          src={heroImageUrl(icon.iconType ?? 2, hero.tag, icon.alticon)}
          alt={hero.name}
          title={hero.name}
        />
      );
    }
    case 'item': {
      const item = icon.refId != null ? meta?.itemById.get(icon.refId) : undefined;
      if (!item) return null;
      return (
        <img className="cat-title-icon contain" src={itemImageUrl(0, item.tag)} alt={item.name} title={item.name} />
      );
    }
    case 'facet':
    case 'custom':
      if (!icon.folder || !icon.tag) return null;
      return (
        <img
          className={`cat-title-icon contain${icon.folder === 'facets' ? ' facet' : ''}`}
          src={imageUrl(icon.folder, icon.tag)}
          alt={icon.tag}
          title={icon.tag}
        />
      );
    default:
      return null;
  }
}

/** Renders a category header: optional icon then the text/preset label. */
export default function CategoryLabel({ category }: { category: Category }) {
  const text = category.preset !== undefined ? presetLabel(category.preset) : category.text ?? '';
  return (
    <>
      {category.icon && <IconImg icon={category.icon} />}
      {text && <span className="cat-title-text">{text}</span>}
    </>
  );
}
