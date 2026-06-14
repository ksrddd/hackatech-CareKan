import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface ElderlyModeContextValue {
  isOn: boolean;
  toggle: () => void;
}

const ElderlyModeContext = createContext<ElderlyModeContextValue | null>(null);

const STORAGE_KEY = 'carekan.elderlyMode';

export function ElderlyModeProvider({ children }: { children: ReactNode }) {
  const [isOn, setIsOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isOn) root.classList.add('elderly');
    else root.classList.remove('elderly');
    window.localStorage.setItem(STORAGE_KEY, isOn ? '1' : '0');
  }, [isOn]);

  const toggle = useCallback(() => setIsOn((v) => !v), []);

  const value = useMemo(() => ({ isOn, toggle }), [isOn, toggle]);

  return (
    <ElderlyModeContext.Provider value={value}>
      {children}
    </ElderlyModeContext.Provider>
  );
}

export function useElderlyMode(): ElderlyModeContextValue {
  const ctx = useContext(ElderlyModeContext);
  if (!ctx) {
    throw new Error('useElderlyMode must be used within ElderlyModeProvider');
  }
  return ctx;
}
