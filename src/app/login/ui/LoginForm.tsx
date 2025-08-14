"use client";
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ callbackUrl: '/account', email }),
      });
      if (!res.ok) throw new Error('No se pudo enviar el enlace.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (submitted) {
    return <p>Revisa tu correo para continuar.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" aria-labelledby="login-title">
      <label id="login-title" className="sr-only">Iniciar sesión por email</label>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit">Enviar enlace</button>
    </form>
  );
}
