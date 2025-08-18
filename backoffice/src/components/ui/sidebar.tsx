'use client';

import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Órdenes', href: '/dashboard/orders', icon: Package },
  { name: 'Usuarios', href: '/dashboard/users', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Reportes', href: '/dashboard/reports', icon: FileText },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-screen">
      <div className="flex items-center justify-center h-16 px-4 border-b">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-safetap-600" />
          <span className="text-xl font-bold text-gray-900">SafeTap Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
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
  );
}
