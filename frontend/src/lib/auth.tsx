import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '@/shared/api/client';
import { MOCK_USERS } from './mockData';
import type { Role, User } from './types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** Mock implementation today; will call POST /auth/login when backend lands.
   *  Throws ApiError on failure so callers can use useRequest naturally. */
  login: (nationalId: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'carekan.auth.userId';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) return null;
    return MOCK_USERS.find((u) => u.id === id) ?? null;
  });

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, user.id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback<AuthContextValue['login']>(
    async (nationalId, password) => {
      await sleep(120);
      if (!/^\d{13}$/.test(nationalId)) {
        throw new ApiError(
          'เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก',
          400,
        );
      }
      if (password.length < 4) {
        throw new ApiError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 400);
      }
      const found = MOCK_USERS.find((u) => u.nationalId === nationalId);
      if (!found) {
        throw new ApiError(
          'ไม่พบบัญชีนี้ในระบบ — ลองใช้บัญชี demo: 1234567890123',
          401,
        );
      }
      setUser(found);
      return found;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      hasRole,
    }),
    [user, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
