import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/** Camera QR scanner. Calls onResult with the first decoded string. */
export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let cancelled = false;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data) {
          onResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          raf = requestAnimationFrame(tick);
        }
      })
      .catch(() => setError('Could not access the camera.'));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  if (error) return <p className="muted">{error}</p>;
  return <video ref={videoRef} className="qr-scanner" muted playsInline />;
}
