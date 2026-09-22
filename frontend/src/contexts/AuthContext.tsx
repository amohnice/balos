'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getToken, getUser, setToken, setUser, logout as clearStoredAuth, type StoredUser } from '../lib/auth';
import { api } from '@/lib/api';

export type User = StoredUser;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = getToken();
      const savedUser = getUser();

      if (savedToken) {
        // Try to refresh user + memberships from the server to ensure permissions are accurate
        try {
          const res = await api.auth.me();
          const serverUser = res.data?.user as StoredUser | undefined;
          const businesses = (res.data as any)?.businesses ?? [];

          if (serverUser) {
            const stored = { ...serverUser, businesses } as StoredUser;
            setTokenState(savedToken);
            setUserState(stored);
            setUser(stored);
          } else if (savedUser) {
            // Fallback to local storage user if /me didn't return user
            setTokenState(savedToken);
            setUserState(savedUser);
          } else {
            clearStoredAuth();
            setTokenState(null);
            setUserState(null);
          }
        } catch {
          // If the token is invalid or request fails, clear stored auth
          clearStoredAuth();
          setTokenState(null);
          setUserState(null);
        }
      } else {
        clearStoredAuth();
        setTokenState(null);
        setUserState(null);
      }

      setLoading(false);
    })();
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setTokenState(newToken);
    setUserState(newUser);
    setLoading(false);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setTokenState(null);
    setUserState(null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(token && user),
      loading,
    }),
    [user, token, login, logout, updateUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
