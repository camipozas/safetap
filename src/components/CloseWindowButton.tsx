'use client';
import { useRouter } from 'next/navigation';

interface CloseWindowButtonProps {
  className?: string;
  children: React.ReactNode;
}

export default function CloseWindowButton({
  className,
  children,
}: CloseWindowButtonProps) {
  const router = useRouter();

  const handleClose = () => {
    // Intenta cerrar la ventana si fue abierta por JavaScript
    if (window.opener) {
      window.close();
    } else {
      // Si no se puede cerrar, redirige a la página de cuenta
      router.push('/account');
    }
  };

  return (
    <button onClick={handleClose} className={className}>
      {children}
    </button>
  );
}
