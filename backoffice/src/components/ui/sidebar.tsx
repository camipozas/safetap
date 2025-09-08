'use client';

import {
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Órdenes', href: '/dashboard/orders', icon: Package },
  { name: 'Usuarios', href: '/dashboard/users', icon: Users },
  { name: 'Descuentos', href: '/dashboard/discounts', icon: Percent },
  { name: 'Promociones', href: '/dashboard/promotions', icon: Percent },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Reportes', href: '/dashboard/reports', icon: FileText },
  { name: 'Guía de Uso', href: '/dashboard/guide', icon: BookOpen },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
          onKeyDown={(e) => e.key === 'Escape' && onToggle && onToggle()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        />
      )}

      {/* Sidebar */}
      <div
        data-testid="sidebar-container"
        data-open={isOpen}
        className={`
        fixed inset-y-0 left-0 z-[50] w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between h-16 px-4 border-b lg:justify-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-safetap-600" />
            <span className="text-xl font-bold text-gray-900">
              SafeTap Admin
            </span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-safetap-100 text-safetap-900 border-r-2 border-safetap-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() =>
              signOut({ callbackUrl: `${window.location.origin}/auth/signin` })
            }
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

// Mobile navigation header component
export function MobileHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 justify-center">
          <Shield className="h-5 w-5 text-safetap-600" />
          <span className="text-base font-semibold text-gray-900">
            SafeTap Admin
          </span>
        </div>
        <button
          onClick={onToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            onToggle();
          }}
          className="p-3 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          data-testid="mobile-toggle"
          aria-label="Toggle menu"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
