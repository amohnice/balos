'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasSystemRole, hasBusinessRole } from '@/lib/permissions';

interface Props {
  children: ReactNode;
  systemRoles?: string[];
  businessId?: string;
  businessRoles?: string[];
  fallback?: ReactNode | null;
}

export default function RequireRole({ children, systemRoles, businessId, businessRoles, fallback = null }: Props) {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (systemRoles && hasSystemRole(user, systemRoles)) return <>{children}</>;
  if (businessRoles && hasBusinessRole(user, businessId, businessRoles)) return <>{children}</>;
  if (!systemRoles && businessRoles && hasBusinessRole(user, businessId, businessRoles)) return <>{children}</>;

  return <>{fallback}</>;
}
