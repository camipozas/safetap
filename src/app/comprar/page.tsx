import { redirect } from 'next/navigation';

export default function ComprarPage() {
  // Temporalmente redirigir ruta heredada a la versión en inglés
  redirect('/buy');
  return null;
}
