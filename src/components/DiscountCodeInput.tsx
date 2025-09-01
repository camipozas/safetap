'use client';

import { useState } from 'react';

interface DiscountValidationResult {
  valid: boolean;
  type?: 'PERCENT' | 'FIXED';
  amount?: number;
  appliedDiscount?: number;
  newTotal?: number;
  message?: string;
}

interface DiscountCodeInputProps {
  cartTotal: number;
  onDiscountApplied: (
    result: DiscountValidationResult & { code: string }
  ) => void;
  onDiscountRemoved: () => void;
  appliedDiscount?: {
    code: string;
    amount: number;
    newTotal: number;
  } | null;
}

export default function DiscountCodeInput({
  cartTotal,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyDiscount = async () => {
    if (!code.trim()) {
      setError('Ingresa un código de descuento');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal,
        }),
      });

      const result: DiscountValidationResult = await response.json();

      if (result.valid) {
        onDiscountApplied({
          ...result,
          code: code.trim().toUpperCase(),
        });
        setCode('');
        setError(null);
      } else {
        setError(result.message || 'Código de descuento no válido');
      }
    } catch {
      setError('Error al validar el código de descuento');
    } finally {
      setIsApplying(false);
    }
  };

  const removeDiscount = () => {
    onDiscountRemoved();
    setCode('');
    setError(null);
  };

  if (appliedDiscount) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-green-800 font-medium">
                Código aplicado: {appliedDiscount.code}
              </p>
              <p className="text-green-700 text-sm">
                Descuento: ${appliedDiscount.amount.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
          <button
            onClick={removeDiscount}
            className="text-green-600 hover:text-green-800 font-medium text-sm"
          >
            Quitar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-medium text-slate-900 mb-3">Código de descuento</h4>

      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Ingresa tu código"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isApplying}
          />
          <button
            onClick={applyDiscount}
            disabled={isApplying || !code.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
          >
            {isApplying ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Aplicar'
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        <p className="text-slate-600 text-xs">
          Ingresa un código válido para obtener descuentos en tu pedido
        </p>
      </div>
    </div>
  );
}
