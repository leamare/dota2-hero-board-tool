import { Link } from 'react-router-dom';
import Modal from './Modal';
import { APP_VERSION } from '../../lib/config';

interface Props {
  open: boolean;
  onClose: () => void;
  /** how many grids were converted from the old version, if any */
  converted?: number;
}

/** Shown once per app version, after the rewrite replaced the old tool. */
export default function WhatsNewModal({ open, onClose, converted = 0 }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_VERSION}`} width="38rem">
      <p>
        The Hero Grid Tool has been rebuilt from scratch. Everything is faster, the layout engine is
        new, and grids now travel as compact codes instead of long blobs.
      </p>

      {converted > 0 && (
        <p className="whatsnew-migrated">
          Your {converted} grid{converted === 1 ? '' : 's'} from the previous version{' '}
          {converted === 1 ? 'was' : 'were'} converted and {converted === 1 ? 'is' : 'are'} waiting
          in <Link to="/layouts">Grids</Link>. Portrait styles and item settings use the new
          defaults — adjust them in the sidebar.
        </p>
      )}

      <ul>
        <li>
          <b>Items</b> can go on the grid alongside heroes, with inventory or profile-badge icons.
        </li>
        <li>
          <b>Chained categories</b> — link categories horizontally or vertically and they stay
          together as the grid reflows.
        </li>
        <li>
          <b>Row breaks</b> inside a category, so you can group portraits into rows.
        </li>
        <li>
          <b>Shareable images</b> — export the whole grid as a PNG with a QR code back to it.
        </li>
        <li>
          <b>Portable grids</b> — copy a grid code, save it as a file, and import codes, JSON or
          files exported from the old version.
        </li>
        <li>
          Alternate hero portraits, category icons, colour tags, more preset labels and tier labels,
          drag-and-drop everywhere, and five interface languages.
        </li>
      </ul>

      <p className="muted">
        See <Link to="/about">About</Link> for the supported grid formats.
      </p>

      <div style={{ marginTop: '1rem' }}>
        <button className="btn primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
