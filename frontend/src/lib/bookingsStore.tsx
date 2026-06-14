import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_QUEUE_TODAY,
  MOCK_APPOINTMENTS,
} from './mockData';
import type { Appointment, AppointmentStatus } from './types';

interface GetBookingOptions {
  /** If set, only return the appointment when its userId matches.
   *  Citizens MUST pass this to avoid reading other patients' records
   *  by walking IDs — see PDPA / data-minimization in CLAUDE / README. */
  requireOwnerUserId?: string;
}

interface BookingsContextValue {
  myBookings: (userId: string) => Appointment[];
  adminQueueToday: () => Appointment[];
  getBooking: (id: string, opts?: GetBookingOptions) => Appointment | undefined;
  createBooking: (input: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateStatus: (id: string, status: AppointmentStatus) => void;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

const STORAGE_KEY = 'carekan.bookings';
const OVERRIDES_KEY = 'carekan.statusOverrides';

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readMap(key: string): Record<string, AppointmentStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [created, setCreated] = useState<Appointment[]>(() =>
    readArray<Appointment>(STORAGE_KEY),
  );
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, AppointmentStatus>
  >(() => readMap(OVERRIDES_KEY));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
  }, [created]);

  useEffect(() => {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  const applyOverride = useCallback(
    (a: Appointment): Appointment => {
      const next = statusOverrides[a.id];
      return next ? { ...a, status: next } : a;
    },
    [statusOverrides],
  );

  const myBookings = useCallback<BookingsContextValue['myBookings']>(
    (userId) => {
      const all = [...MOCK_APPOINTMENTS, ...created]
        .filter((a) => a.userId === userId)
        .map(applyOverride);
      return all.sort((a, b) =>
        a.date === b.date
          ? a.startTime.localeCompare(b.startTime)
          : a.date.localeCompare(b.date),
      );
    },
    [created, applyOverride],
  );

  const adminQueueToday = useCallback<
    BookingsContextValue['adminQueueToday']
  >(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const isoToday = `${y}-${m}-${d}`;
    const extra = created
      .filter((a) => a.date === isoToday)
      .map(applyOverride);
    return [...ADMIN_QUEUE_TODAY.map(applyOverride), ...extra].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [created, applyOverride]);

  const getBooking = useCallback<BookingsContextValue['getBooking']>(
    (id, opts) => {
      const all = [...MOCK_APPOINTMENTS, ...ADMIN_QUEUE_TODAY, ...created];
      const found = all.find((a) => a.id === id);
      if (!found) return undefined;
      if (opts?.requireOwnerUserId && found.userId !== opts.requireOwnerUserId) {
        return undefined;
      }
      return applyOverride(found);
    },
    [created, applyOverride],
  );

  const createBooking = useCallback<BookingsContextValue['createBooking']>(
    (input) => {
      const id = `a-${Date.now().toString(36)}`;
      const a: Appointment = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
      };
      setCreated((prev) => [...prev, a]);
      return a;
    },
    [],
  );

  const updateStatus = useCallback<BookingsContextValue['updateStatus']>(
    (id, status) => {
      setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    },
    [],
  );

  const value = useMemo<BookingsContextValue>(
    () => ({
      myBookings,
      adminQueueToday,
      getBooking,
      createBooking,
      updateStatus,
    }),
    [myBookings, adminQueueToday, getBooking, createBooking, updateStatus],
  );

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings(): BookingsContextValue {
  const ctx = useContext(BookingsContext);
  if (!ctx) {
    throw new Error('useBookings must be used within BookingsProvider');
  }
  return ctx;
}
