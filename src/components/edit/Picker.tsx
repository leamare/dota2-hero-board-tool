import Modal from '../ui/Modal';
import PickerGrid from './PickerGrid';
import { useT } from '../../lib/i18n';
import type { GridElement } from '../../types/board';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (element: GridElement) => void;
  /** portrait type of the target category, so previews match what's on the grid */
  previewType?: number;
  keepOpen?: boolean;
}

export default function Picker({ open, onClose, onPick, previewType = 0, keepOpen }: Props) {
  const t = useT();
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={t('picker.add')} width="54rem">
      <PickerGrid
        previewType={previewType}
        autoFocus
        onPick={(el) => {
          onPick(el);
          if (!keepOpen) onClose();
        }}
      />
    </Modal>
  );
}
