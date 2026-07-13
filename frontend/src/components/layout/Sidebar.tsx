'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutIcon } from './NavIcons';
import { getNavItems } from './navItems';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const businessName = user?.businesses && user.businesses.length > 0 ? user.businesses[0].name : undefined;
  const displayName = loading ? '' : businessName ?? user?.name ?? 'Account';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:bg-white md:border-r md:border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-light text-gray-900 tracking-tight">Balos</h1>
        <p className="min-h-5 truncate text-sm text-gray-500">{displayName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {getNavItems(user).map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-10 items-center gap-3 px-4 py-2 rounded transition ${
                isActive ? 'bg-gray-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex min-h-10 items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
