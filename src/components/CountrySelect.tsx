'use client';
import { useId, useState } from 'react';

const countries: { code: string; name: string; flag: string }[] = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
];

export function CountrySelect({
  label = 'País',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  name,
  value,
  onChange,
  error,
}: {
  label?: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  error?: string;
}) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <div className="relative">
      <label
        className="block text-sm font-semibold text-slate-900 mb-2"
        htmlFor={id}
      >
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          id={id}
          className={`w-full px-4 py-3 rounded-xl border bg-white text-left focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 flex items-center justify-between ${
            error ? 'border-red-300' : 'border-slate-300'
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center">
            {selectedCountry ? (
              <>
                <span className="text-xl mr-3">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-slate-500">Selecciona un país</span>
            )}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-lg max-h-60 overflow-auto">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center transition-colors duration-150 ${
                  value === country.code ? 'bg-brand-50 text-brand-700' : ''
                }`}
                onClick={() => {
                  onChange?.(country.code);
                  setIsOpen(false);
                }}
              >
                <span className="text-xl mr-3">{country.flag}</span>
                <span>{country.name}</span>
                {value === country.code && (
                  <svg
                    className="w-5 h-5 ml-auto text-brand-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className="text-red-600 text-sm mt-1 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Cerrar dropdown al hacer click fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              setIsOpen(false);
            }
          }}
          tabIndex={0}
          aria-label="Cerrar menú de selección de país"
          role="button"
        />
      )}
    </div>
  );
}
