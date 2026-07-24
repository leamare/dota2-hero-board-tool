import { heroImageUrl, imageUrl, itemImageUrl } from '../../lib/images';
import { presetLabel } from '../../lib/constants';
import type { CategoryName } from '../../types/board';
import { useMetadata } from '../../state/MetadataProvider';

/** Renders a category header label according to its name type. */
export default function CategoryLabel({ name }: { name: CategoryName }) {
  const meta = useMetadata();

  switch (name.type) {
    case 'preset':
      return <span>{presetLabel(name.preset ?? 0)}</span>;

    case 'hero': {
      const hero = name.refId != null ? meta?.heroById.get(name.refId) : undefined;
      if (!hero) return <span className="empty-label">?</span>;
      return (
        <img
          className="cat-title-icon"
          src={heroImageUrl(name.iconType ?? 2, hero.tag, name.alticon)}
          alt={hero.name}
          title={hero.name}
        />
      );
    }

    case 'item': {
      const item = name.refId != null ? meta?.itemById.get(name.refId) : undefined;
      if (!item) return <span className="empty-label">?</span>;
      return (
        <img
          className="cat-title-icon contain"
          src={itemImageUrl(0, item.tag)}
          alt={item.name}
          title={item.name}
        />
      );
    }

    case 'icon': {
      if (!name.iconFolder || !name.iconTag) return <span className="empty-label">?</span>;
      return (
        <img
          className="cat-title-icon contain"
          src={imageUrl(name.iconFolder, name.iconTag)}
          alt={name.iconTag}
          title={name.iconTag}
        />
      );
    }

    case 'text':
    default:
      return <span>{name.text}</span>;
  }
}
