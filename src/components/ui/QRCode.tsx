import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface Props {
  text: string;
  /** pixels per QR module — the image grows with the amount of data */
  scale?: number;
  /** never render narrower than this, so short codes aren't tiny */
  minSize?: number;
}

/**
 * Renders a QR code for the given text, or a note if it's too large.
 *
 * Sized per module rather than to a fixed width: a dense code (a whole
 * collection of grids) yields a bigger image instead of being squeezed into a
 * fixed box, where the modules would blur together and stop scanning.
 */
export default function QRCode({ text, scale = 4, minSize = 200 }: Props) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    QRCodeLib.toDataURL(text, { scale, margin: 2, errorCorrectionLevel: 'L' })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [text, scale]);

  if (failed)
    return <div className="qr-fail">Too much data to fit in a QR code — use the text instead.</div>;
  if (!url) return <div className="qr-fail">Generating…</div>;
  return <img className="qr" src={url} alt="QR code" style={{ minWidth: minSize }} />;
}
