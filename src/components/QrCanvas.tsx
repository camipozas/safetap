"use client";
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function QrCanvas({ url, alt = 'Código QR' }: { url: string; alt?: string }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 192, margin: 1 })
      .then((d) => active && setDataUrl(d))
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [url]);
  if (!dataUrl) return <div aria-busy="true" aria-live="polite" className="w-48 h-48 bg-slate-200 rounded"/>;
  return <img src={dataUrl} alt={alt} className="w-48 h-48" />;
}
