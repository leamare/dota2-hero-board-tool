import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import QRCode from '../ui/QRCode';
import { buildShareUrl } from '../../lib/shareUrl';
import { downloadJson, downloadText, gridCode } from '../../lib/gridFile';
import { useBoardStore } from '../../state/boardStore';
import type { Board } from '../../types/board';

interface Props {
  open: boolean;
  onClose: () => void;
  /** share this board instead of the one currently being edited */
  board?: Board;
}

export default function ShareModal({ open, onClose, board: given }: Props) {
  const current = useBoardStore((s) => s.board);
  const board = given ?? current;
  const url = useMemo(() => (open ? buildShareUrl(board) : ''), [open, board]);
  const code = useMemo(() => (open ? gridCode(board) : ''), [open, board]);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const copy = async (what: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? url : code);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={given ? `Share "${board.name || 'grid'}"` : 'Share this grid'}
      width="44rem"
    >
      <p className="muted" style={{ marginBottom: '0.75rem' }}>
        The whole grid is packed into this link — no server needed.
      </p>
      <div className="share-body">
        <div className="share-main">
          <textarea
            className="input share-link"
            readOnly
            value={url}
            rows={4}
            onFocus={(e) => e.target.select()}
          />
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => copy('link')}>
              {copied === 'link' ? 'Copied!' : 'Copy link'}
            </button>
            <button className="btn" title="Just the grid code, without the link" onClick={() => copy('code')}>
              {copied === 'code' ? 'Copied!' : 'Copy code'}
            </button>
            <span className="muted" style={{ alignSelf: 'center' }}>{url.length} characters</span>
          </div>
          <div className="share-files">
            <span className="muted">Save a copy:</span>
            <button className="btn small" onClick={() => downloadText(board.name, code)}>
              .txt (code)
            </button>
            <button
              className="btn small"
              onClick={() => downloadJson(board.name, { name: board.name, board })}
            >
              .json
            </button>
          </div>
        </div>
        {open && <QRCode text={url} />}
      </div>
    </Modal>
  );
}
