export const TOKEN_KEY = 'balos_token';
export const USER_KEY = 'balos_user';

export interface StoredBusiness {
  id: string;
  name: string;
  location?: string | null;
  role?: string;
  isActive?: boolean;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  systemRole: string;
  businesses?: StoredBusiness[];
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function setToken(token: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function setUser(user: StoredUser): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): StoredUser | null {
  if (!canUseStorage()) return null;

  const user = window.localStorage.getItem(USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    removeUser();
    return null;
  }
}

export function removeUser(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(USER_KEY);
}

export function logout(): void {
  removeToken();
  removeUser();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
