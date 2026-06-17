# CareKan Frontend Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy the existing `hackatech-CareKan` frontend into `D:\labs\CareKan\frontend` and rewire its data layer from localStorage mocks to the real backend API (Plan 1), so the app runs end-to-end on Postgres while looking identical.

**Architecture:** Keep every page/component visually unchanged. Replace only the data sources: `AuthProvider` calls `api.login/register/me` + stores a JWT; a new set of `useQuery`/`useRequest` hooks replace the synchronous `BookingsProvider`; pages that read static hospital/slot data from `mockData.ts` now call `api.listHospitals/getHospital/listTimeSlots`. Vite proxies `/api` → backend `:4000`. Pure-UI constants (announcements, consult rooms, hourly load) stay as local static data.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind. Existing `shared/api/client.ts`, `shared/api/endpoints.ts`, `shared/state/useRequest.ts` are reused as-is.

## Global Constraints

- **Prerequisite:** Plan 1 (backend) is complete, `docker compose up -d` is running, backend seeded and serving on `:4000`.
- **No `any`** (frontend convention #1). Use `shared` DTOs.
- All API access goes through `api.<endpoint>()` from `src/shared/api/endpoints.ts` — never raw `fetch`, never re-add localStorage as a data store.
- `localStorage` is used for **only two** things: the JWT (`carekan.auth.token`) and the elderly-mode UI pref (already implemented in `elderlyMode.tsx` — leave it).
- PDPA: citizen appointment-detail reads must still pass through an owner check — now enforced server-side (the API 404s non-owners), so the frontend just surfaces the 404.
- Pages must render loading + error states via the `RequestState` discriminated union from `useRequest.ts`.
- Demo accounts (password `care1234`): citizen `1234567890123`, admin `9876543210987`.
- Backend's one contract addition: `LoginResponse`/`RegisterResponse` now include `token: string` (set via `setAuthToken`).

---

## File Structure

```
D:\labs\CareKan\frontend\           # copied from hackatech-CareKan\frontend
├── vite.config.ts                  # MODIFY: add /api proxy → :4000
├── .env.local                      # CREATE: (optional) VITE_API_BASE_URL override
└── src/
    ├── lib/
    │   ├── auth.tsx                # REWRITE: real api.login/register/me + JWT
    │   ├── bookingsStore.tsx       # DELETE (replaced by hooks below)
    │   ├── appointments.ts         # CREATE: useMyAppointments/useAppointment/useCreateAppointment
    │   ├── adminQueue.ts           # CREATE: useAdminQueue/useUpdateStatus
    │   ├── hospitals.ts            # CREATE: useHospitals/useHospital/useTimeSlots
    │   ├── uiContent.ts            # CREATE: static UI constants moved out of mockData
    │   └── mockData.ts             # DELETE (after pages repointed)
    ├── shared/api/endpoints.ts     # MODIFY: read token type; remove dead useMock
    └── pages/… components/…        # MODIFY: repoint data sources (per Task table)
```

---

## Task 1: Copy frontend + wire the Vite proxy + token plumbing

**Files:**
- Copy: `D:\labs\hackatech-CareKan\frontend` → `D:\labs\CareKan\frontend`
- Modify: `D:\labs\CareKan\frontend\vite.config.ts`
- Modify: `D:\labs\CareKan\frontend\src\shared\api\endpoints.ts`
- Create: `D:\labs\CareKan\frontend\.env.local`

**Interfaces:**
- Produces: a running copied frontend whose `api.*` calls hit `http://localhost:4000/api/*` via the dev proxy. `BASE_URL` stays `/api`.

- [ ] **Step 1: Copy the frontend (excluding node_modules) and install**

PowerShell:
```
Copy-Item -Recurse -Exclude node_modules "D:\labs\hackatech-CareKan\frontend" "D:\labs\CareKan\frontend"
cd D:\labs\CareKan\frontend
npm install
```
(If `Copy-Item -Exclude` still pulls `node_modules`, copy then `Remove-Item -Recurse -Force node_modules` before `npm install`.)

- [ ] **Step 2: Add the `/api` proxy to `vite.config.ts`**

In `D:\labs\CareKan\frontend\vite.config.ts`, add a `server.proxy` entry inside the config:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
},
```

Keep all existing config (plugins, resolve, etc.). If `server` already exists, merge `proxy` into it.

- [ ] **Step 3: Remove the dead `useMock`/`mock.ts` reference from `endpoints.ts`**

In `src/shared/api/endpoints.ts`, delete the line `const useMock = import.meta.env.VITE_USE_MOCK !== 'false';`, delete the `export { useMock };` at the bottom, and delete the comment block referencing `mock.ts`. Leave all `api.*` functions unchanged (they already call the real `apiFetch`).

- [ ] **Step 4: Create `.env.local`**

`D:\labs\CareKan\frontend\.env.local`:
```
# Dev uses the Vite proxy, so VITE_API_BASE_URL stays unset (defaults to /api).
# Set this only when pointing at a non-proxied backend:
# VITE_API_BASE_URL=http://localhost:4000/api
```

- [ ] **Step 5: Smoke-test the proxy**

With backend running (`cd ../backend && npm run dev`) and frontend running (`npm run dev`), open the browser console at `http://localhost:5173` and run:
```js
fetch('/api/health').then(r => r.json()).then(console.log)
```
Expected: `{ ok: true }`.

- [ ] **Step 6: Commit**

```bash
git add D:/labs/CareKan/frontend D:/labs/CareKan/.gitignore
git commit -m "chore(frontend): copy app + vite /api proxy to backend:4000"
```

---

## Task 2: Rewire `AuthProvider` to real login/register/me + JWT

**Files:**
- Modify (rewrite): `D:\labs\CareKan\frontend\src\lib\auth.tsx`

**Interfaces:**
- Consumes: `api.login/register/me/logout`, `setAuthToken` from `client.ts`, `ApiError`.
- Produces: `useAuth()` with `{ user, isAuthenticated, login(nationalId,password), register(input), logout(), hasRole(role), isLoading }`. JWT persisted at `localStorage['carekan.auth.token']`. On mount, if a token exists, it's set on the client and `api.me()` re-hydrates `user`.
- **Breaking change:** `login` keeps signature `(nationalId, password) => Promise<User>`. New `register(input: RegisterRequest) => Promise<User>` is added (consumed by `Register.tsx` in Task 6).

- [ ] **Step 1: Rewrite `auth.tsx`**

Replace the entire file `src/lib/auth.tsx` with:

```tsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { api } from '@/shared/api/endpoints';
import { setAuthToken } from '@/shared/api/client';
import type { RegisterRequest } from '../../../shared/api';
import type { Role, User } from './types';

const TOKEN_KEY = 'carekan.auth.token';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nationalId: string, password: string) => Promise<User>;
  register: (input: RegisterRequest) => Promise<User>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
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

  // Re-hydrate session from a stored token on first mount.
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

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user, isAuthenticated: user !== null, isLoading, login, register, logout, hasRole,
  }), [user, isLoading, login, register, logout, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Guard `ProtectedRoute` against the loading flash**

In `src/components/ProtectedRoute.tsx`, pull `isLoading` from `useAuth()` and, while `isLoading` is true, render a minimal loading placeholder (e.g. `return <div className="p-8 text-center">กำลังโหลด…</div>;`) **before** the existing `isAuthenticated` redirect check — so a page refresh on a protected route doesn't bounce to `/login` before `api.me()` resolves.

- [ ] **Step 3: Manual verification**

Run backend + frontend. At `/login`, log in with `1234567890123` / `care1234`. Expected: redirect to `/my-appointments`. Refresh the page — you stay logged in (token rehydrated). Open DevTools → Application → Local Storage: `carekan.auth.token` is present; the old `carekan.auth.userId` is gone.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/auth.tsx frontend/src/components/ProtectedRoute.tsx
git commit -m "feat(frontend): real JWT auth provider (login/register/me) + loading guard"
```

---

## Task 3: Hospital data hooks + repoint search/detail/landing

**Files:**
- Create: `D:\labs\CareKan\frontend\src\lib\hospitals.ts`
- Create: `D:\labs\CareKan\frontend\src\lib\uiContent.ts`
- Modify: `HospitalSearch.tsx`, `Landing.tsx`, `HospitalDetail.tsx`, `HospitalCard.tsx`, `DateGrid.tsx`, `TimeSlotGrid.tsx`, `Login.tsx`

**Interfaces:**
- Consumes: `api.listHospitals/getHospital/listTimeSlots`, `useQuery`.
- Produces:
  - `useHospitals(query: HospitalsQuery)` → `RequestState<Hospital[]>`.
  - `useHospital(id: string)` → `RequestState<{ hospital: Hospital; clinics: ClinicCode[] }>`.
  - `useTimeSlots(hospitalId, date, clinic)` → `RequestState<TimeSlot[]>`.
  - `uiContent.ts` exports `ANNOUNCEMENTS` (moved from mockData).

- [ ] **Step 1: Create `lib/hospitals.ts`**

```ts
import { useQuery } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { HospitalsQuery } from '../../../shared/api';
import type { ClinicCode } from './types';

export function useHospitals(query: HospitalsQuery) {
  return useQuery(
    (signal) => api.listHospitals(query, signal).then((r) => r.hospitals),
    [query.q, query.district, query.zone, query.service, query.right],
  );
}

export function useHospital(id: string) {
  return useQuery((signal) => api.getHospital(id, signal), [id]);
}

export function useTimeSlots(hospitalId: string, date: string, clinic: ClinicCode | '') {
  return useQuery(
    (signal) =>
      clinic === ''
        ? Promise.resolve([])
        : api.listTimeSlots(hospitalId, { date, clinic }, signal).then((r) => r.slots),
    [hospitalId, date, clinic],
  );
}
```

- [ ] **Step 2: Create `lib/uiContent.ts` (move static constants out of mockData)**

```ts
// Pure presentational content — not part of the API contract.
export const ANNOUNCEMENTS = {
  loginNotice:
    'วันที่ 12–14 ก.ค. ระบบจะปิดปรับปรุงระหว่างเวลา 23:00–02:00 น. ผู้รับบริการสามารถจองคิวล่วงหน้านอกช่วงเวลาดังกล่าวได้ตามปกติ',
};

export interface ConsultRoom { number: string; doctor: string; status: 'in_use' | 'available' | 'closed'; }
export const CONSULT_ROOMS: ConsultRoom[] = [
  { number: '207', doctor: 'พญ.สุภาวดี', status: 'in_use' },
  { number: '208', doctor: 'นพ.วิทยา', status: 'in_use' },
  { number: '209', doctor: 'พญ.พัชราภา', status: 'available' },
  { number: '210', doctor: 'ปิดเช้านี้', status: 'closed' },
];

export const ADMIN_HOURLY_LOAD = [
  { hour: '07:00', booked: 20, capacity: 20 }, { hour: '08:00', booked: 18, capacity: 20 },
  { hour: '09:00', booked: 17, capacity: 20, current: true }, { hour: '10:00', booked: 12, capacity: 20 },
  { hour: '11:00', booked: 8, capacity: 20 }, { hour: '13:00', booked: 4, capacity: 20 },
  { hour: '14:00', booked: 6, capacity: 20 }, { hour: '15:00', booked: 2, capacity: 20 },
];
```

- [ ] **Step 3: Repoint `Login.tsx`**

Change the import `import { ANNOUNCEMENTS } from '@/lib/mockData';` → `import { ANNOUNCEMENTS } from '@/lib/uiContent';`. No other change (login already uses `useAuth().login` via `useRequest`).

- [ ] **Step 4: Repoint `HospitalSearch.tsx`**

Replace `import { HOSPITALS } from '@/lib/mockData';` with the hook. Build a `HospitalsQuery` from the page's existing filter state (district/zone/service/right/q), call `const { state } = useHospitals(query);`, and render: `state.kind === 'submitting'` → loading skeleton; `'error'` → error message; `'success'` → map `state.data` exactly where the page previously mapped the `HOSPITALS`-derived filtered array. Remove any client-side filtering that the API now does (`zone`/`service`/`right`/`q`), keeping any purely-visual sort the page added.

- [ ] **Step 5: Repoint `Landing.tsx`**

Replace `import { HOSPITALS } from '@/lib/mockData';` with `const { state } = useHospitals({});` and render the featured/preview hospital list from `state.kind === 'success' ? state.data : []`. Keep the existing layout; show nothing (or a small skeleton) while `submitting`.

- [ ] **Step 6: Repoint `HospitalDetail.tsx`**

Replace `import { getHospital, HOSPITAL_CLINICS } from '@/lib/mockData';` with `const { id } = useParams(); const { state } = useHospital(id!);`. From `state.data` use `hospital` (was `getHospital(id)`) and `clinics` (was `HOSPITAL_CLINICS[id]`). Render loading/error/`not found` (the hook 404s via `ApiError`, surfaced as `state.kind === 'error'`).

- [ ] **Step 7: Repoint `HospitalCard.tsx` + `DateGrid.tsx`**

These imported `getDayAvailability`/`generateSlots` from mockData for a small "X คิวว่าง" badge / per-day availability. Replace with a lighter approach to avoid N calls:
- `HospitalCard.tsx`: remove the `getDayAvailability` import and the availability badge's data source; instead show a static "เปิดจองคิว" affordance, OR (if the badge is important) fetch via `useTimeSlots` for a default clinic/date — **recommended: drop the live badge** to avoid a request per card. Keep the card layout otherwise unchanged.
- `DateGrid.tsx`: remove `getDayAvailability`; the per-day "remaining" hint becomes static or omitted. The actual availability is shown in `TimeSlotGrid` (Task 4) from real slots. Keep date selection behavior.

- [ ] **Step 8: Typecheck**

Run (from `frontend`): `npm run typecheck`
Expected: errors only in files not yet repointed (BookAppointment, MyAppointments, AppointmentDetail, BookSuccess, admin pages, TimeSlotGrid — fixed in Tasks 4–7). No errors in the files touched here.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/lib/hospitals.ts frontend/src/lib/uiContent.ts frontend/src/pages/Login.tsx frontend/src/pages/HospitalSearch.tsx frontend/src/pages/Landing.tsx frontend/src/pages/HospitalDetail.tsx frontend/src/components/HospitalCard.tsx frontend/src/components/DateGrid.tsx
git commit -m "feat(frontend): hospital data hooks + repoint search/landing/detail"
```

---

## Task 4: Booking flow — slots, create, success

**Files:**
- Create: `D:\labs\CareKan\frontend\src\lib\appointments.ts`
- Modify: `TimeSlotGrid.tsx`, `BookAppointment.tsx`, `BookSuccess.tsx`

**Interfaces:**
- Consumes: `api.createAppointment/getAppointment/getMyAppointments`, `useQuery`, `useRequest`.
- Produces:
  - `useMyAppointments()` → `RequestState<MyAppointmentsResponse>` + `refetch`.
  - `useAppointment(id)` → `RequestState<Appointment>`.
  - `useCreateAppointment()` → `{ state, run(input: CreateAppointmentRequest) }` (wraps `useRequest`).

- [ ] **Step 1: Create `lib/appointments.ts`**

```ts
import { useQuery, useRequest } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { CreateAppointmentRequest } from '../../../shared/api';

export function useMyAppointments() {
  return useQuery((signal) => api.getMyAppointments(signal), []);
}

export function useAppointment(id: string) {
  return useQuery((signal) => api.getAppointment(id, signal).then((r) => r.appointment), [id]);
}

export function useCreateAppointment() {
  return useRequest((signal, input: CreateAppointmentRequest) =>
    api.createAppointment(input, signal).then((r) => r.appointment),
  );
}
```

- [ ] **Step 2: Repoint `TimeSlotGrid.tsx`**

Replace `import { generateSlots } from '@/lib/mockData';`. The grid receives (or derives) `hospitalId`, `date`, `clinic` from `BookAppointment`. Use `const { state } = useTimeSlots(hospitalId, date, clinic);` (from `lib/hospitals.ts`). Render: `submitting` → loading; `success` → map `state.data` (a `TimeSlot[]`) to the existing slot buttons, where a slot is disabled when `slot.booked >= slot.capacity`. Keep the visual grid unchanged. The selected slot's `id` is what `BookAppointment` submits as `slotId`.

> If `TimeSlotGrid` currently takes slots as a prop, instead lift the `useTimeSlots` call into `BookAppointment` (Step 3) and pass `slots` down — pick whichever matches the current prop shape; both are fine.

- [ ] **Step 3: Repoint `BookAppointment.tsx` (3-step wizard)**

Replace `import { DEFAULT_HOSPITAL, HOSPITALS, HOSPITAL_CLINICS } from '@/lib/mockData';` and `const { createBooking } = useBookings();`:
- Hospital + clinics come from `useHospital(hospitalId)` (the wizard already knows the hospital id from the route/state; if it allowed picking from `HOSPITALS`, use `useHospitals({})` for the picker). `DEFAULT_HOSPITAL` → first of `useHospitals({})` data, or the route's hospital.
- Clinics list (step 1) comes from `useHospital(id).clinics`.
- Slots (step 2) come from `useTimeSlots(hospitalId, selectedDate, selectedClinic)`.
- Submit (step 3): `const create = useCreateAppointment();` then on confirm:
  ```ts
  const appt = await create.run({
    hospitalId, clinic: selectedClinic, purpose: selectedPurpose,
    reason: reasonText, slotId: selectedSlotId,
  });
  if (appt) navigate(`/book/success/${appt.id}`);
  ```
- Disable the confirm button while `create.state.kind === 'submitting'` (frontend convention #4). On `create.state.kind === 'error'`, show `create.state.error.message`.

- [ ] **Step 4: Repoint `BookSuccess.tsx`**

Replace `import { getHospital } from '@/lib/mockData';` and `const { getBooking } = useBookings();`. Use `const { id } = useParams(); const { state } = useAppointment(id!);`. From `state.data` (an `Appointment`) read `bookingRef`, `queueNumber`, `date`, `startTime`, etc. The hospital name comes from a second `useHospital(state.data.hospitalId)` call **or** simpler: render `state.data.hospitalId`→name via a small lookup using `useHospitals({})`. Render loading/error. The QR stub component is unchanged.

- [ ] **Step 5: Typecheck + manual booking test**

Run: `npm run typecheck` (booking files now clean).
Manual: log in as citizen → `/search` → รพ.กลาง → จองคิว → pick clinic med + purpose → pick a future date + an open time slot → confirm. Expected: lands on `/book/success/:id` showing a `CK-XXXXXX` ref and `A0xx` queue number. Re-open `/my-appointments` — the new booking appears under upcoming.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/appointments.ts frontend/src/components/TimeSlotGrid.tsx frontend/src/pages/BookAppointment.tsx frontend/src/pages/BookSuccess.tsx
git commit -m "feat(frontend): real booking flow (slots + create + success)"
```

---

## Task 5: Citizen appointments — list + live-queue detail

**Files:**
- Modify: `MyAppointments.tsx`, `AppointmentDetail.tsx`

**Interfaces:**
- Consumes: `useMyAppointments`, `useAppointment`, `useHospital` (for hospital name), `useAuth`.

- [ ] **Step 1: Repoint `MyAppointments.tsx`**

Replace `import { useBookings } from '@/lib/bookingsStore';` + `const { myBookings } = useBookings();` and `import { getHospital } from '@/lib/mockData';`. Use `const { state } = useMyAppointments();`. From `state.data` render `upcoming` and `history` arrays directly (the API already splits them — delete the old client-side split). Hospital names: build a lookup from `useHospitals({})` (`Map<id, shortName>`), or display the hospital from each appointment via a small `useHospital` per card (prefer the single `useHospitals` map to avoid N requests). Render loading/error states. Remove the `useAuth().user.id` argument that `myBookings(userId)` needed — the API infers the user from the JWT.

- [ ] **Step 2: Repoint `AppointmentDetail.tsx` with live polling**

Replace `import { useBookings } from '@/lib/bookingsStore';` (`getBooking`) and `import { getHospital } from '@/lib/mockData';`. Use:
```ts
const { id } = useParams();
const { state, refetch } = useAppointment(id!);
useEffect(() => {
  const t = setInterval(refetch, 5000); // live queue refresh (matches prototype's 5s)
  return () => clearInterval(t);
}, [refetch]);
```
The PDPA owner check is now server-side: a non-owner id yields `state.kind === 'error'` with a 404 `ApiError` — render the existing "ไม่พบนัดหมาย" state for that. Hospital name via `useHospital(state.data.hospitalId)` when `success`. The "current queue / waiting before you / your number" widget keeps its existing computation, but its inputs now come from the polled `Appointment` (its `queueNumber` + `status`); if that widget previously read the *whole queue* from the bookings store, fetch it via the admin queue is not available to citizens — instead derive "waiting before you" from the appointment's own `queueNumber` vs a `currentlyServing` value. **Simplest correct approach:** display `queueNumber`, `status` (via `appointmentStatusLabel`), and a relative position computed as before from `queueNumber`; do not expose other patients' data (PDPA).

> Note: if the prototype's live-queue widget genuinely needs the "currently serving" number, add it to the citizen appointment response later (a `currentServingQueue?: string` field on `AppointmentResponse`). Out of scope for this pass — keep the widget driven by the appointment's own fields.

- [ ] **Step 3: Typecheck + manual test**

Run: `npm run typecheck`.
Manual: as citizen, open `/my-appointments` (seeded: ≥1 upcoming + ≥1 history). Click an appointment → detail shows queue info; leave it open and, in another tab, advance its status via admin (Task 6) — within 5s the citizen view updates.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/MyAppointments.tsx frontend/src/pages/AppointmentDetail.tsx
git commit -m "feat(frontend): citizen appointments list + polling detail"
```

---

## Task 6: Register flow + admin queue + admin dashboard + delete mocks

**Files:**
- Modify: `Register.tsx`, `pages/admin/QueueView.tsx`, `pages/admin/AdminDashboard.tsx`
- Create: `D:\labs\CareKan\frontend\src\lib\adminQueue.ts`
- Delete: `D:\labs\CareKan\frontend\src\lib\bookingsStore.tsx`, `D:\labs\CareKan\frontend\src\lib\mockData.ts`
- Modify: `App.tsx` / provider stack (remove `BookingsProvider`)

**Interfaces:**
- Consumes: `useAuth().register`, `api.getAdminQueue/updateAppointmentStatus`.
- Produces:
  - `useAdminQueue(hospitalId, date, clinic?)` → `RequestState<Appointment[]>` + `refetch`.
  - `useUpdateStatus()` → `{ state, run(id, status) }`.

- [ ] **Step 1: Create `lib/adminQueue.ts`**

```ts
import { useQuery, useRequest } from '@/shared/state/useRequest';
import { api } from '@/shared/api/endpoints';
import type { AppointmentStatus, ClinicCode } from './types';

export function useAdminQueue(hospitalId: string, date: string, clinic?: ClinicCode) {
  return useQuery(
    (signal) => api.getAdminQueue({ hospitalId, date, clinic }, signal).then((r) => r.appointments),
    [hospitalId, date, clinic ?? ''],
  );
}

export function useUpdateStatus() {
  return useRequest((signal, id: string, status: AppointmentStatus) =>
    api.updateAppointmentStatus(id, { status }, signal).then((r) => r.appointment),
  );
}
```

- [ ] **Step 2: Repoint `Register.tsx`**

The 4-step register wizard collects `nationalId, firstName, lastName, birthDate, sex, phone, email, password, acceptedPdpaAt`. On final submit, call `const { register } = useAuth();` and `await register(input)` (wrapped in `useRequest` for the disabled-while-submitting button). On success the provider stores the token + user → navigate to `/my-appointments`. Map the PDPA-accept checkbox to `acceptedPdpaAt: new Date().toISOString()`.

- [ ] **Step 3: Repoint `QueueView.tsx`**

Replace `import { useBookings } from '@/lib/bookingsStore';` (`adminQueueToday, updateStatus`) and `import { MOCK_USERS } from '@/lib/mockData';`. Use `const { user } = useAuth();` for the admin's `primaryHospitalId` (the hospital to manage), today's date, and:
```ts
const hospitalId = user!.primaryHospitalId ?? 'klang';
const today = new Date().toISOString().slice(0, 10);
const { state, refetch } = useAdminQueue(hospitalId, today, 'med');
const update = useUpdateStatus();
useEffect(() => { const t = setInterval(refetch, 5000); return () => clearInterval(t); }, [refetch]);
```
Each row's name comes from `appointment.userFullName` (replaces the `MOCK_USERS` lookup). "เรียกคิวถัดไป" / "เรียก" buttons call:
```ts
await update.run(appt.id, nextStatusFor(appt.status)); // e.g. confirmed->checked_in->in_progress->completed
refetch();
```
Disable the button while `update.state.kind === 'submitting'`. Render loading/error for the queue list.

- [ ] **Step 4: Repoint `AdminDashboard.tsx`**

Replace `import { useBookings } from '@/lib/bookingsStore';` (`adminQueueToday`) and the mockData imports. Derive the 6 KPIs from `useAdminQueue(hospitalId, today)` data (counts by status: total, checked-in, in-progress, completed, no-show, waiting). The decorative graph + exam rooms come from `uiContent.ts` (`ADMIN_HOURLY_LOAD`, `CONSULT_ROOMS`) — these stay static (flagged in design as UI-only). The "recent bookings" list is the most-recent N from the queue data (sort by `createdAt` desc) instead of `ADMIN_RECENT_BOOKINGS`.

- [ ] **Step 5: Remove `BookingsProvider` from the provider stack**

In `src/App.tsx` (or `main.tsx`), delete the `<BookingsProvider>` wrapper and its import. Keep `AuthProvider` and `ElderlyModeProvider`.

- [ ] **Step 6: Delete the dead mock files**

Delete `src/lib/bookingsStore.tsx` and `src/lib/mockData.ts`. Then:

Run: `npm run typecheck`
Expected: **zero errors** (any remaining import of `mockData`/`bookingsStore` shows up here — fix by repointing to the hooks/`uiContent`). Re-run until clean.

- [ ] **Step 7: Manual end-to-end (the README demo script)**

With backend seeded + running: walk demo steps 1–14 (register → login citizen → my-appointments → search → klang → book wizard → success → status polling → logout → admin login → dashboard → queue → call next → cross-tab citizen sees update).

- [ ] **Step 8: Commit**

```bash
git add frontend/src
git rm frontend/src/lib/bookingsStore.tsx frontend/src/lib/mockData.ts
git commit -m "feat(frontend): register + admin queue/dashboard on real API; drop mocks"
```

---

## Task 7: Build, final typecheck, README

**Files:**
- Modify: `D:\labs\CareKan\README.md`

- [ ] **Step 1: Production build**

Run (from `frontend`): `npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 2: Update root README**

Add a "Frontend" + "Run the whole app" section:
```
Terminal 1: docker compose up -d
Terminal 2: cd backend && npm run dev      # :4000
Terminal 3: cd frontend && npm run dev     # :5173 (proxies /api → :4000)
Open http://localhost:5173
Demo: citizen 1234567890123 / care1234 ; admin 9876543210987 / care1234
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: full-app run instructions"
```

---

## Self-Review Notes (for the implementer)

- **Contract coverage:** every `api.*` endpoint is now consumed by a hook (`hospitals.ts`, `appointments.ts`, `adminQueue.ts`) and `auth.tsx`. No page reads `mockData`/`bookingsStore` after Task 6 Step 6 (enforced by the clean typecheck).
- **Type consistency:** hooks return `RequestState<T>` from the existing `useRequest.ts`; pages must handle all four `kind`s. `useCreateAppointment().run` returns `Appointment | undefined` (undefined on error/abort) — always null-check before navigating.
- **PDPA:** owner checks moved server-side; the frontend never filters another user's data and never re-introduces a localStorage bookings store.
- **Static-vs-real split:** `ANNOUNCEMENTS`, `CONSULT_ROOMS`, `ADMIN_HOURLY_LOAD` are intentionally static UI (`uiContent.ts`); only queue/appointment/hospital data is live. This matches the Q7 design decision (no stations table, no dashboard contract endpoint).
- **N+1 watch:** prefer one `useHospitals({})` map for name lookups over per-card `useHospital` calls in list views (`MyAppointments`, `HospitalCard`).
```