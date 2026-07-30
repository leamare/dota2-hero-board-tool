import { useState, type ReactNode } from 'react';

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  children: ReactNode;
}

/** A dashed area that takes a dropped file. */
export default function FileDropZone({ onFile, children }: Props) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`drop-zone${over ? ' over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      {children}
    </div>
  );
}
