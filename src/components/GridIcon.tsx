import { imageUrl } from '../lib/images';

/** Renders a grid's facet icon, if it has one. */
export default function GridIcon({ tag }: { tag?: string }) {
  if (!tag) return null;
  return <img className="grid-icon" src={imageUrl('facets', tag)} alt="" />;
}
