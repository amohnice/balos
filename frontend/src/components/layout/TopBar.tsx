'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { MenuIcon } from './NavIcons';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, loading } = useAuth();
  const { activeBusinessId, businesses, setActiveBusinessId } = useActiveBusiness();
  const displayName = loading ? '' : user?.name ?? 'Account';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 bg-white/90 backdrop-blur-md px-3 sm:px-6 border-b border-gray-200 w-full overflow-hidden">
      {/* Left side: Mobile Hamburger + Logo + Business Selector */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
          aria-label="Open navigation"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <span className="hidden sm:inline-block md:hidden shrink-0 text-base font-medium text-gray-900 tracking-tight">
          Balos
        </span>

        {/* Business Selector Dropdown */}
        {businesses.length > 0 && (
          <div className="flex items-center gap-1.5 min-w-0 max-w-[180px] sm:max-w-xs">
            <span className="hidden lg:inline text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0">
              Business:
            </span>
            <select
              value={activeBusinessId || ''}
              onChange={(e) => setActiveBusinessId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-gray-900 focus:outline-none transition cursor-pointer truncate w-full"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.role ? `(${b.role})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: User Display Name */}
      <div className="flex items-center shrink-0">
        <span className="max-w-[100px] sm:max-w-[160px] truncate text-right text-xs sm:text-sm font-medium text-gray-700">
          {displayName}
        </span>
      </div>
    </header>
  );
}
