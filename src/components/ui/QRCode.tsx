import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

/** Renders a QR code image for the given text, or a note if it's too large. */
export default function QRCode({ text, size = 220 }: { text: string; size?: number }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    QRCodeLib.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'L' })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [text, size]);

  if (failed) return <div className="qr-fail">Too much data to fit in a QR code — use the text instead.</div>;
  if (!url) return <div className="qr-fail">Generating…</div>;
  return <img className="qr" src={url} width={size} height={size} alt="QR code" />;
}
