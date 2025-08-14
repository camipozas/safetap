"use client";
import { useId } from 'react';

const countries: { code: string; name: string }[] = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Perú' },
  { code: 'US', name: 'Estados Unidos' },
];

export function CountrySelect({
  label = 'País',
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
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        className="input"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="" disabled>Selecciona un país</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
      {error && <p id={`${id}-error`} className="error">{error}</p>}
    </div>
  );
}
