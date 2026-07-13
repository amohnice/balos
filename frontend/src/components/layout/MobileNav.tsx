'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CloseIcon, LogoutIcon } from './NavIcons';
import { getNavItems } from './navItems';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const displayName = user?.businesses && user.businesses.length > 0 ? user.businesses[0].name : user?.name ?? 'Account';

  const handleLogout = () => {
    logout();
    onClose();
    router.replace('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <aside
        className="fixed left-0 top-0 flex h-full w-[min(82vw,18rem)] flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-light text-gray-900 tracking-tight">Balos</h1>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close navigation"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="min-h-5 truncate text-sm text-gray-500 mt-2">{displayName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {getNavItems(user).map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
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
    </div>
  );
}
