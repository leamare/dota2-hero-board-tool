import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  label?: string;
  initial?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

/** Small on-page dialog for entering a name — replaces window.prompt. */
export default function NameDialog({
  open,
  title,
  label = 'Name',
  initial = '',
  submitLabel = 'Save',
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  const submit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width="24rem">
      <div className="field">
        <label>{label}</label>
        <input
          className="input"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" onClick={submit} disabled={!value.trim()}>
          {submitLabel}
        </button>
      </div>
    </Modal>
  );
}
