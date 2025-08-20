'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-brand hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand transition-all duration-200"
        aria-controls="mobile-menu"
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        data-testid="mobile-menu-button"
        onClick={toggleMenu}
      >
        <span className="sr-only">Abrir menú principal</span>
        {/* Hamburger/Close icon */}
        {!isOpen ? (
          <svg
            className="block h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        ) : (
          <svg
            className="block h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          data-testid="mobile-menu"
        >
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            data-testid="mobile-overlay"
            onClick={closeMenu}
          />

          {/* Menu panel - slide from right */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h2
                    id="mobile-menu-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    SafeTap
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-brand hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand transition-colors"
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                >
                  <span className="sr-only">Cerrar menú</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <nav
                className="flex-1 px-4 py-8 space-y-2 bg-white"
                aria-label="Mobile navigation"
              >
                <Link
                  href="/guide"
                  className="flex items-center px-4 py-4 text-base font-medium text-slate-700 hover:text-brand hover:bg-slate-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-slate-200"
                  onClick={closeMenu}
                >
                  <svg
                    className="w-5 h-5 mr-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Guía de uso
                </Link>
                <Link
                  href="/buy"
                  className="flex items-center px-4 py-4 text-base font-medium text-slate-700 hover:text-brand hover:bg-slate-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-slate-200"
                  onClick={closeMenu}
                >
                  <svg
                    className="w-5 h-5 mr-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Comprar
                </Link>
              </nav>

              {/* Login button */}
              <div className="px-4 pb-8 bg-white border-t border-slate-100 pt-4">
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-white bg-brand rounded-xl hover:bg-brand/90 active:bg-brand/80 transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={closeMenu}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
