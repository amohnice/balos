'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MenuIcon } from './NavIcons';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, loading } = useAuth();
  const displayName = loading ? '' : user?.name ?? 'Account';

  return (
    <header className="md:hidden sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 bg-white px-4 border-b border-gray-200">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 text-gray-700 hover:bg-gray-100"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-light text-gray-900 tracking-tight">Balos</h1>

      <span className="min-h-5 max-w-28 truncate text-right text-sm text-gray-500">{displayName}</span>
    </header>
  );
}
