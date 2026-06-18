# Admin Removal & Dead Column Cleanup — Design

**Date:** 2026-06-18  
**Scope:** Remove all admin role functionality (pages, routes, RBAC), and drop every database column that is either admin-only or never written/read anywhere.

---

## Context

CareKan will have a single user role going forward. The admin queue-management feature (dashboard, queue view, status-advance API) is being cut entirely. This spec covers what to delete and what to update.

---

## Approach

Outside-in, four sequential steps:

1. Frontend — delete admin files, update citizen pages
2. Backend — delete admin controller/routes/service functions
3. Shared types — remove Role, dropped User/Appointment fields, admin API contracts
4. Database — one migration dropping all dead columns

The app stays compilable after each step. The DB migration comes last, after all code referencing the dropped columns is already gone.

---

## Step 1 — Frontend

### Delete entirely
- `frontend/src/pages/admin/AdminDashboard.tsx`
- `frontend/src/pages/admin/QueueView.tsx`
- `frontend/src/components/AdminHeader.tsx`
- `frontend/src/components/AdminLayout.tsx`
- `frontend/src/lib/adminQueue.ts`

### Update

**`App.tsx`**
- Remove lazy imports for `AdminDashboard` and `QueueView`
- Remove `AdminLayout` import
- Remove `AdminLoading` component
- Remove the entire `/admin` route block
- Remove `role="citizen"` prop from the remaining `<ProtectedRoute>` usage

**`ProtectedRoute.tsx`**
- Drop the `role` prop entirely
- Only check `isAuthenticated`; redirect unauthenticated users to `/login`

**`Profile.tsx`**
- Remove `useHospital` call and `primaryHospitalId` hospital display block
- Remove `hospitalPatientId` row
- Remove `insuranceRight` row

**Citizen pages — remove `user.insuranceRight` display only**  
(The hospital insurance-right filter in `HospitalSearch` is kept — it filters hospitals by `rightsAccepted`, independent of the user's own right.)
- `BookAppointment.tsx` — remove two `insuranceRight` display spots
- `MyAppointments.tsx` — remove one spot
- `BookSuccess.tsx` — remove one spot
- `AppointmentDetail.tsx` — remove one spot

---

## Step 2 — Backend

### Delete entirely
- `backend/src/controllers/admin.controller.ts`
- `backend/src/test/admin.test.ts`
- `backend/src/test/rbac.test.ts`

### Update

**`routes/index.ts`**
- Remove admin routes (`GET /admin/queue`, `PATCH /admin/appointments/:id/status`)
- Remove `admin` controller import
- Remove `roleGuard` import
- Replace `authGuard, roleGuard('citizen')` with just `authGuard` on appointment routes

**`middleware/auth.ts`**
- Delete `roleGuard` export entirely
- Simplify `req.user` type to `{ id: string }` (no `role`)

**`services/appointment.service.ts`**
- Delete `getAdminQueue` function
- Delete `updateStatus` function
- Delete `LEGAL_TRANSITIONS` map

**`validation/schemas.ts`**
- Delete `adminQuerySchema`
- Delete `updateStatusSchema`

**`controllers/auth.controller.ts`**
- Remove `role: 'citizen'` from `prisma.user.create`
- Remove `insuranceRight: 'uc'` from `prisma.user.create`
- Update `signToken` call to `{ sub: user.id }` only

**`services/auth.service.ts`**
- Simplify `TokenPayload` to `{ sub: string }`
- Remove `role` from `signToken` and `verifyToken`

---

## Step 3 — Shared types

**`shared/types.ts`**
- Remove `Role` type
- Remove from `User` interface: `role`, `insuranceRight`, `primaryHospitalId`, `hospitalPatientId`
- Remove from `Appointment` interface: `checkedInAt`
- Keep `InsuranceRight` type and `insuranceRightLabel` — still used by `Hospital.rightsAccepted` and hospital search filter

**`shared/api.ts`**
- Remove `AdminQueueQuery`, `AdminQueueResponse`, `UpdateStatusRequest` interfaces
- Remove `ROUTE_ROLES` map entirely

**`backend/src/services/mappers.ts`**
- `toUserDto` — remove mappings for `role`, `insuranceRight`, `primaryHospitalId`, `hospitalPatientId`
- `toAppointmentDto` — remove `checkedInAt` mapping

---

## Step 4 — Database migration

One Prisma migration. Update `schema.prisma` first, then run `prisma migrate dev`.

**`users` table — drop columns:**
- `role` — also remove `Role` enum from schema
- `insurance_id`
- `insurance_right` — keep `InsuranceRight` enum (used by `Hospital.rightsAccepted`)
- `profile_image`
- `address`
- `username`
- `primary_hospital_id`
- `hospital_patient_id`

**`reserves` table — drop columns:**
- `current_station_id`
- `checked_in_at`
- `queue_updated_at`

After migration: run `prisma generate` to re-emit the client. TypeScript compilation confirms no remaining references to dropped columns.

---

## What stays unchanged

- `AppointmentStatus` enum and all its values
- `InsuranceRight` enum and `insuranceRightLabel`
- Hospital insurance-right filter in `HospitalSearch`
- `Hospital.rightsAccepted` field
- `Reserve.queueNumber` (shown to citizens on their booking)
- All citizen-facing routes and pages not mentioned above
- `consentAt` on User (PDPA consent, set during registration)
