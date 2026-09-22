'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  location?: string | null;
  role?: string;
}

interface ActiveBusinessContextType {
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  businesses: Business[];
  setActiveBusinessId: (id: string) => void;
  loading: boolean;
}

const ActiveBusinessContext = createContext<ActiveBusinessContextType | undefined>(undefined);

export function ActiveBusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setActiveBusinessIdState(null);
      setLoading(false);
      return;
    }

    api.businesses
      .list()
      .then((res: any) => {
        const list = (res.data || []) as Business[];
        setBusinesses(list);
        if (list.length > 0) {
          // Default to first business or preserved storage choice
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('balos_active_biz') : null;
          const match = list.find((b) => b.id === savedId);
          setActiveBusinessIdState(match ? match.id : list[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const setActiveBusinessId = (id: string) => {
    setActiveBusinessIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('balos_active_biz', id);
    }
  };

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || null;

  return (
    <ActiveBusinessContext.Provider
      value={{
        activeBusinessId,
        activeBusiness,
        businesses,
        setActiveBusinessId,
        loading,
      }}
    >
      {children}
    </ActiveBusinessContext.Provider>
  );
}

export function useActiveBusiness() {
  const context = useContext(ActiveBusinessContext);
  if (!context) throw new Error('useActiveBusiness must be used within ActiveBusinessProvider');
  return context;
}
