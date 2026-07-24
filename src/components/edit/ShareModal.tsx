import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { buildShareUrl } from '../../lib/shareUrl';
import { useBoardStore } from '../../state/boardStore';

export default function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const board = useBoardStore((s) => s.board);
  const url = useMemo(() => (open ? buildShareUrl(board) : ''), [open, board]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this grid" width="40rem">
      <p className="muted" style={{ marginBottom: '0.75rem' }}>
        The whole grid is packed into this link — no server needed.
      </p>
      <textarea className="input share-link" readOnly value={url} rows={4} onFocus={(e) => e.target.select()} />
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <button className="btn primary" onClick={copy}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <span className="muted" style={{ alignSelf: 'center' }}>{url.length} characters</span>
      </div>
    </Modal>
  );
}
