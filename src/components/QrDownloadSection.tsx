"use client";
import { useState } from 'react';
import { QrCanvas } from '@/components/QrCanvas';

interface QrDownloadSectionProps {
  url: string;
  filename?: string;
  className?: string;
}

export function QrDownloadSection({ 
  url, 
  filename = 'safetap-qr',
  className = ''
}: QrDownloadSectionProps) {
  const [downloadSize, setDownloadSize] = useState(512);
  const [downloadDPI, setDownloadDPI] = useState(300);

  const downloadQR = async (format: 'png' | 'svg') => {
    try {
      const params = new URLSearchParams({
        url,
        format,
        size: downloadSize.toString(),
        dpi: downloadDPI.toString()
      });
      
      const response = await fetch(`/api/qr/generate?${params}`);
      if (!response.ok) throw new Error('Error al generar QR');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}-${downloadSize}px-${downloadDPI}dpi.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading QR:', error);
      alert('Error al descargar el QR. Intenta de nuevo.');
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Descarga QR de Alta Resolución</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <h4 className="font-medium mb-2">Vista Previa</h4>
          <div className="border rounded p-4 text-center">
            <QrCanvas
              url={url}
              size={200}
              highResolution={true}
              className="mx-auto mb-2"
            />
            <p className="text-xs text-gray-600">
              Vista previa - Tamaño real: {downloadSize}px @ {downloadDPI} DPI
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div>
          <h4 className="font-medium mb-3">Configuración de Descarga</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño Final (px)
              </label>
              <select
                value={downloadSize}
                onChange={(e) => setDownloadSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value={256}>256px - Pequeño</option>
                <option value={512}>512px - Estándar</option>
                <option value={1024}>1024px - Grande</option>
                <option value={2048}>2048px - Extra Grande</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolución de Impresión (DPI)
              </label>
              <select
                value={downloadDPI}
                onChange={(e) => setDownloadDPI(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value={150}>150 DPI - Pantalla</option>
                <option value={300}>300 DPI - Impresión Estándar</option>
                <option value={600}>600 DPI - Impresión Premium</option>
                <option value={1200}>1200 DPI - Impresión Profesional</option>
              </select>
            </div>
            
            <div className="pt-4 space-y-2">
              <button
                onClick={() => downloadQR('png')}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                📥 Descargar PNG ({downloadSize}px @ {downloadDPI} DPI)
              </button>
              
              <button
                onClick={() => downloadQR('svg')}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                📥 Descargar SVG (Vectorial)
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Recomendaciones:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>PNG 300 DPI para stickers físicos</li>
              <li>SVG para máxima escalabilidad</li>
              <li>600+ DPI para impresión profesional</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
