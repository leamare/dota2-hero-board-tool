import { imageUrl } from '../lib/images';
import { DEFAULT_GRID_ICON } from '../lib/constants';

/** Renders a grid's facet icon, falling back to a generic one when unset. */
export default function GridIcon({ tag }: { tag?: string }) {
  return <img className="grid-icon" src={imageUrl('facets', tag || DEFAULT_GRID_ICON)} alt="" />;
}
