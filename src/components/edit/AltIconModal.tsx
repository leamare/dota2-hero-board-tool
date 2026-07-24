import Modal from '../ui/Modal';
import { heroImageUrl } from '../../lib/images';
import { useBoardStore } from '../../state/boardStore';
import { useMetadata } from '../../state/MetadataProvider';
import { resolveDisplay } from '../../lib/board';

interface Props {
  target: { catId: string; index: number } | null;
  onClose: () => void;
}

/** Swap a placed hero to one of its alternate portraits/icons. */
export default function AltIconModal({ target, onClose }: Props) {
  const meta = useMetadata();
  const board = useBoardStore((s) => s.board);
  const patchElement = useBoardStore((s) => s.patchElement);

  if (!target) return null;
  const category = board.categories.find((c) => c.id === target.catId);
  const el = category?.elements[target.index];
  if (!category || !el || el.kind !== 'hero' || el.refId == null) return null;

  const hero = meta?.heroById.get(el.refId);
  if (!hero) return null;

  const { type } = resolveDisplay(category, board);
  const options: (string | null)[] = [null, ...hero.alticons];

  const choose = (alticon: string | null) => {
    patchElement(target.catId, target.index, { alticon });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`${hero.name} — icon variant`} width="34rem">
      <div className="alticon-grid">
        {options.map((alt) => (
          <button
            key={alt ?? 'default'}
            className={`alticon-option${(el.alticon ?? null) === alt ? ' active' : ''}`}
            onClick={() => choose(alt)}
          >
            <img src={heroImageUrl(type, hero.tag, alt)} alt={alt ?? 'default'} loading="lazy" />
            <span>{alt ?? 'Default'}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
