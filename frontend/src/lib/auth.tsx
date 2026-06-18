import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { api } from '@/shared/api/endpoints';
import { setAuthToken } from '@/shared/api/client';
import type { RegisterRequest } from '../../../shared/api';
import type { User } from './types';

const TOKEN_KEY = 'carekan.auth.token';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nationalId: string, password: string) => Promise<User>;
  register: (input: RegisterRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
  setAuthToken(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => readToken() !== null);

  useEffect(() => {
    const token = readToken();
    if (!token) return;
    setAuthToken(token);
    let cancelled = false;
    api.me()
      .then((res) => { if (!cancelled) setUser(res.user); })
      .catch(() => { if (!cancelled) storeToken(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (nationalId, password) => {
    const res = await api.login({ nationalId, password });
    storeToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const res = await api.register(input);
    storeToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    void api.logout().catch(() => undefined);
    storeToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, isAuthenticated: user !== null, isLoading, login, register, logout,
  }), [user, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
