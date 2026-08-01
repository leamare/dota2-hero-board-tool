import { imageUrl } from '../lib/images';
import { DEFAULT_GRID_ICON } from '../lib/constants';

/** Renders a grid's facet icon, falling back to a generic one when unset. */
export default function GridIcon({ tag }: { tag?: string }) {
  // `facet` marks it as white line art, which the light theme inverts
  return <img className="grid-icon facet" src={imageUrl('facets', tag || DEFAULT_GRID_ICON)} alt="" />;
}
