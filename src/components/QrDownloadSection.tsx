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
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadQR = async (format: 'png' | 'svg') => {
    if (isDownloading) return;
    
    setError(null);
    setIsDownloading(true);
    
    try {
      const params = new URLSearchParams({
        url,
        format,
        size: downloadSize.toString(),
        dpi: downloadDPI.toString()
      });
      
      const response = await fetch(`/api/qr/generate?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
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
      setError(error instanceof Error ? error.message : 'Unexpected error downloading QR. Please try again.');
    } finally {
      setIsDownloading(false);
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
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error al descargar</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="ml-auto text-red-600 hover:text-red-800"
                      aria-label="Cerrar error"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => downloadQR('png')}
                disabled={isDownloading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>📥 Descargar PNG ({downloadSize}px @ {downloadDPI} DPI)</>
                )}
              </button>
              
              <button
                onClick={() => downloadQR('svg')}
                disabled={isDownloading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>📥 Descargar SVG (Vectorial)</>
                )}
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
