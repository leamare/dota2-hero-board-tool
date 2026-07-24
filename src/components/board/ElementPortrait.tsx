import { getStyle, imageUrl } from '../../lib/images';
import type { GridElement } from '../../types/board';
import { useMetadata } from '../../state/MetadataProvider';

interface Props {
  element: GridElement;
  styleId: number;
}

export default function ElementPortrait({ element, styleId }: Props) {
  const meta = useMetadata();
  const ref =
    element.kind === 'item'
      ? meta?.itemById.get(element.refId)
      : meta?.heroById.get(element.refId);
  const tag = ref?.tag ?? '';
  const style = getStyle(styleId);

  return (
    <div className="portrait" style={{ aspectRatio: style.aspect }} title={ref?.name}>
      <img
        src={imageUrl(styleId, tag, element.alticon)}
        alt={ref?.name ?? tag}
        loading="lazy"
      />
    </div>
  );
}
