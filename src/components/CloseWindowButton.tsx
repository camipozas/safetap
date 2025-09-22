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
    if (window.opener) {
      window.close();
    } else {
      router.push('/account');
    }
  };

  return (
    <button onClick={handleClose} className={className}>
      {children}
    </button>
  );
}
