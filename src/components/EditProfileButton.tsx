'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface EditProfileButtonProps {
  stickerId: string;
  className?: string;
  children: React.ReactNode;
}

export default function EditProfileButton({
  stickerId,
  className = '',
  children,
}: EditProfileButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      const directClickHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `/sticker/${stickerId}/profile/edit`;
        router.push(url);
      };

      button.addEventListener('click', directClickHandler);

      return () => {
        button.removeEventListener('click', directClickHandler);
      };
    }
  }, [stickerId, router]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `/sticker/${stickerId}/profile/edit`;

    try {
      router.push(url);
    } catch (error) {
      console.error('Error during navigation:', error);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {children}
    </button>
  );
}
