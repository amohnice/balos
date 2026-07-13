'use client';

import {
  DashboardIcon,
  HistoryIcon,
  PackageIcon,
  SaleIcon,
  SettingsIcon,
  SuppliersIcon,
  TeamIcon,
} from './NavIcons';
import type { StoredUser } from '@/lib/auth';
import { hasBusinessRole } from '@/lib/permissions';

export function getNavItems(user?: StoredUser | null) {
  const businessId = user?.businesses && user.businesses.length > 0 ? user.businesses[0].id : undefined;

  const items = [
    { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { href: '/bales', label: 'Bales', Icon: PackageIcon, roles: ['OWNER', 'MANAGER', 'SORTER', 'CASHIER'] },
    { href: '/suppliers', label: 'Suppliers', Icon: SuppliersIcon, roles: ['OWNER', 'MANAGER'] },
    { href: '/sales/new', label: 'New Sale', Icon: SaleIcon, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { href: '/sales/history', label: 'Sales History', Icon: HistoryIcon, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { href: '/team', label: 'Team', Icon: TeamIcon, roles: ['OWNER', 'MANAGER'] },
    { href: '/settings', label: 'Settings', Icon: SettingsIcon },
  ];

  return items.filter((it) => {
    if (!it.roles) return true; // public within business
    // if user is super-admin, show
    if (user?.systemRole === 'SUPER_ADMIN') return true;
    return hasBusinessRole(user ?? null, businessId, it.roles);
  });
}
