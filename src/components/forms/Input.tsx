'use client';
import { useId } from 'react';

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string | number;
  onChange?: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value as any}
        onChange={(e) => onChange?.(e.target.value)}
        className="input"
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="error">
          {error}
        </p>
      )}
    </div>
  );
}
