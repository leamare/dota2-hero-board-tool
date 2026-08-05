import Modal from './Modal';
import Rich from './Rich';
import { APP_VERSION } from '../../lib/config';
import { useT } from '../../lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  /** how many grids were converted from the old version, if any */
  converted?: number;
}

const POINTS = ['items', 'chains', 'breaks', 'images', 'portable', 'misc'];

/** Shown once per app version, after the rewrite replaced the old tool. */
export default function WhatsNewModal({ open, onClose, converted = 0 }: Props) {
  const t = useT();
  const w = (key: string) => t(`whatsnew.${key}`);

  return (
    <Modal open={open} onClose={onClose} title={w('title').replace('{version}', APP_VERSION)} width="38rem">
      <p>{w('intro')}</p>

      {converted > 0 && (
        <p className="whatsnew-migrated">
          <Rich text={w('migrated')} />
        </p>
      )}

      <ul>
        {POINTS.map((k) => (
          <li key={k}>
            <Rich text={w(k)} />
          </li>
        ))}
      </ul>

      <p className="muted">
        <Rich text={w('seeAbout')} />
      </p>

      <div style={{ marginTop: '1rem' }}>
        <button className="btn primary" onClick={onClose}>
          {w('gotIt')}
        </button>
      </div>
    </Modal>
  );
}
