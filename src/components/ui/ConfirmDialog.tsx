import type { ReactNode } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A yes/no dialog for actions that throw work away. */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="34rem">
      {children}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
