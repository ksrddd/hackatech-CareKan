# CareKan Backend — Technical Specification

| | |
|---|---|
| **Service** | `carekan-backend` |
| **Runtime** | NestJS 10 (Express platform) · Node.js 20 · TypeScript (CommonJS) |
| **Data** | Prisma 5 · Supabase Postgres |
| **Branch** | `backend-nest` |
| **Version** | 1.0.0 |
| **Status** | Phase 1 delivered (deploy pending) · Phase 2 specified |
| **Last updated** | 2026-07-12 |

---

## 1. Overview

The CareKan backend is a REST API for a public-hospital appointment booking system in Bangkok. It serves three classes of consumer:

1. **Citizen** — end users who authenticate with a national ID (JWT) to search hospitals, book appointments, and view booking slips / QR codes.
2. **Hospital systems** — server-to-server integrations that call the API with an API key to create and update reservations.
3. **LINE Official Account** — a webhook that replies to messages and sends Flex Messages.

This document defines the architecture, API contract, data model, security, and deployment of the current system (Phase 1, as-built), and specifies the planned feature work (Phase 2).

### 1.1 Scope

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Migrate the runtime from Express to NestJS and the database to Supabase while preserving the existing API contract exactly | Delivered — production deployment pending |
| **Phase 2** | Add patient-journey features (before / during / after treatment) additively | Specified — §11 |

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Component | Notes |
|-------|-----------|-------|
| HTTP framework | NestJS 10 on `@nestjs/platform-express` | DI container + module system |
| ORM | Prisma 5 | schema-first, versioned migrations |
| Database | Supabase Postgres | accessed via connection pooler (§9.1) |
| Validation | Zod via a custom `ZodValidationPipe` | schemas in `src/validation/schemas.ts` |
| Auth (citizen) | `jsonwebtoken` (HS256, 7-day expiry) | tokens issued/verified in-house |
| Auth (hospital) | API key (SHA-256 hash) via `x-api-key` header | |
| Messaging | `@line/bot-sdk` | webhook + Messaging API |
| Test | Vitest + Supertest + `unplugin-swc` | e2e tests exercise real HTTP |
| Module system | CommonJS (`module: Node16`) | required for decorator metadata |

### 2.2 Module Layout

The system is organized as one NestJS module per domain. Business logic lives in `*.service.ts` (`@Injectable`); HTTP binding lives in `*.controller.ts`.

```
src/
├─ main.ts                    # bootstrap (NestFactory + configureApp)
├─ configure-app.ts           # shared app configuration used by main.ts and tests
├─ app.module.ts              # root module
├─ common/
│  ├─ errors/                 # ApiError, AllExceptionsFilter
│  ├─ pipes/                  # ZodValidationPipe
│  ├─ guards/                 # JwtAuthGuard, HospitalKeyGuard
│  └─ decorators/             # @CurrentUser, @HospitalKey
├─ config/env.ts              # Zod env schema + validateEnv
├─ prisma/                    # PrismaService (@Global), PrismaModule
├─ auth/                      # register / login / logout / me
├─ hospitals/                 # list / detail / time-slots
├─ appointments/              # create / mine / detail / scanned
├─ hospital-api/              # hospital-key reserve create + status
├─ api-keys/                  # citizen API-key request form → Sheets
├─ line/                      # webhook, signature guard, flex-messages
├─ mappers/                   # Prisma row → shared DTO
└─ validation/schemas.ts      # Zod schemas
```

Dependencies: `PrismaModule` is `@Global`; `AuthModule` exports `AuthService` to modules that use `JwtAuthGuard` (appointments, api-keys).

### 2.3 Request Pipeline

```
Request
  → Guard (JwtAuthGuard | HospitalKeyGuard | LineSignatureGuard)   [if present]
  → ZodValidationPipe (parse body/query)
  → Controller
  → Service (business logic, Prisma)
  → Mapper (row → DTO)
  → Response
Any exception → AllExceptionsFilter → error envelope (§4.4)
```

### 2.4 Application Bootstrap

`configureApp(app)` is the single point of application configuration, invoked by both `main.ts` and the test bootstrap to guarantee that the runtime and test environments are identical.

| Setting | Value | Rationale |
|---------|-------|-----------|
| `rawBody` | `true` | the LINE webhook needs the raw body to verify the HMAC signature |
| CORS | `origin: true, credentials: true` | preserves prior Express behavior |
| Global prefix | `api`, excluding `line/webhook` | the LINE webhook lives outside `/api` |
| Global filter | `AllExceptionsFilter` | one error envelope across the system |
| Shutdown hooks | enabled | closes Prisma connections gracefully |

---

## 3. API Contract

### 3.1 Conventions

- **Base path:** `/api` (except `POST /line/webhook`)
- **Content type:** `application/json`
- **Authentication schemes:**
  - `JWT` — header `Authorization: Bearer <token>`
  - `x-api-key` — header `x-api-key: <key>` (or `Authorization: ApiKey <key>`)
  - `LINE signature` — header `x-line-signature` (HMAC-SHA256)
- **Status codes:** as specified in §3.2 — codes that differ from the NestJS default are set explicitly with `@HttpCode`.

### 3.2 Endpoint Inventory

**Health**

| Method | Path | Auth | Success | Response |
|--------|------|------|---------|----------|
| GET | `/api/health` | — | 200 | `{ ok, service, version }` |

**Auth**

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/auth/register` | — | 201 `{ user, token }` | `409 DUPLICATE`, `400 VALIDATION` |
| POST | `/api/auth/login` | — | 200 `{ user, token }` | `401 BAD_CREDENTIALS` |
| POST | `/api/auth/logout` | — | 204 | — |
| GET | `/api/auth/me` | JWT | 200 `{ user }` | `401 UNAUTHENTICATED`, `401 INVALID_TOKEN`, `404 NOT_FOUND` |

**Hospitals**

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| GET | `/api/hospitals?q&district&zone&service&right` | — | 200 `{ hospitals }` | `400 VALIDATION` |
| GET | `/api/hospitals/:id` | — | 200 `{ hospital }` | `404 NOT_FOUND` |
| GET | `/api/hospitals/:id/time-slots?date=YYYY-MM-DD` | — | 200 `{ slots }` | `400 VALIDATION` |

**Appointments**

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/appointments` | JWT | 201 `{ appointment }` | `404 SLOT_NOT_FOUND`, `400 DATE_MISMATCH`, `409 SLOT_FULL`, `500 REF_COLLISION` |
| GET | `/api/appointments/me` | JWT | 200 `{ upcoming, history }` | `401` |
| GET | `/api/appointments/:id` | JWT | 200 `{ appointment }` | `404 NOT_FOUND` |
| GET | `/api/scanned/:id` | — | 200 `{ appointment }` | `404 NOT_FOUND` |

> `GET /api/appointments/:id` returns `404` both when the record is missing and when the caller is not its owner (does not leak existence).
> The `me` route is declared before `:id` so the paths do not collide.

**API Key Request** (citizen-facing form)

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/api/api-keys/requests` | JWT | 201 `{ submitted: true }` |

**Hospital API** (server-to-server)

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/hospital/reserves` | `x-api-key` | 201 `{ appointment }` | `401 MISSING_API_KEY`, `401 INVALID_API_KEY`, `401 KEY_REVOKED`, `403 HOSPITAL_MISMATCH`, `404 PATIENT_NOT_FOUND`, `404 SLOT_NOT_FOUND`, `409 SLOT_FULL` |
| PATCH | `/api/hospital/reserves/:id/status` | `x-api-key` | 200 `{ appointment }` | `404 RESERVE_NOT_FOUND`, `403 HOSPITAL_MISMATCH` |

**LINE**

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/line/webhook` | LINE signature | 200 |

### 3.3 Data Transfer Objects

All request/response types are defined in `shared/api.ts` and `shared/types.ts`, which both the frontend and backend import. Changing a DTO therefore changes the contract on both sides simultaneously. `src/mappers/mappers.ts` is the only layer that converts Prisma rows into DTOs.

### 3.4 Error Model

Every error response uses a single envelope (`ApiErrorBody`):

```json
{ "error": "<message>", "code": "<OPTIONAL_CODE>", "details": { "<field>": "<message>" } }
```

| Source | HTTP status | Shape |
|--------|-------------|-------|
| `ApiError` (business error) | as specified | `{ error, code?, details? }` |
| `ZodError` (validation) | 400 | `{ error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION", details }` |
| Other (unhandled) | 500 | `{ error: "เกิดข้อผิดพลาดภายในระบบ" }` |

The `error` field is a Thai-language string and is shown directly to the user by the frontend; these strings are treated as part of the contract.

---

## 4. Data Model

The schema is defined in `prisma/schema.prisma` (Postgres) and comprises five tables and six enums.

| Model | Table | Role | Key constraints |
|-------|-------|------|-----------------|
| `User` | `users` | citizen account | `nationalId` unique, `email` unique |
| `Hospital` | `hospitals` | hospital | `services[]`, `rightsAccepted[]` are enum arrays; grouped by `zone` |
| `Schedule` | `schedules` | weekly template time slots (shared by all hospitals) | unique `(dayOfWeek, startTime)` |
| `Reserve` | `reserves` | reservation | `bookingCode` unique; index `(hospitalId, scheduleId, date)` |
| `HospitalApiKey` | `hospital_api_keys` | hospital API key | `hash` unique; supports revocation |

**Enums:** `InsuranceRight`, `Sex`, `ServiceType`, `Zone`, `AppointmentStatus` (`pending`/`confirmed`/`checked_in`/`in_progress`/`completed`/`cancelled`/`no_show`).

**Design notes:**
- `Schedule` has no foreign key to `Hospital` — it is a shared template that every hospital uses for its opening times (see §12, item 3).
- `Reserve.queueNumber` is computed as the current booked count + 1 at creation time.

---

## 5. Security & Privacy

### 5.1 Citizen Authentication
- Passwords are hashed with bcrypt (cost 10).
- JWT payload `{ sub: userId }` is signed with `JWT_SECRET` (HS256), 7-day expiry.
- `registerSchema` validates the real Thai national-ID checksum (`isThaiNationalId`).

### 5.2 Hospital API Keys
- Keys have the form `ck_live_<random>` and are stored in the database only as a **SHA-256 hash** (plaintext is never persisted).
- Verified by `HospitalKeyGuard`; supports `revokedAt` and records `lastUsedAt` fire-and-forget.
- Each key is bound to a single `hospitalId` — creating or modifying a reservation for another hospital is rejected with `403 HOSPITAL_MISMATCH`.

### 5.3 LINE Webhook
- `x-line-signature` (HMAC-SHA256 over the raw body) is verified in `LineSignatureGuard` before any processing.

### 5.4 Row Level Security (Supabase)
Phase 1 accesses Postgres through Prisma using the `postgres` role, which bypasses RLS entirely, so **no table has an RLS policy yet**. Constraint to enforce: do not enable PostgREST/anon access to these tables until policies are written (a prerequisite for Phase 2, §11.9).

---

## 6. Configuration

Environment variables are loaded via `@nestjs/config` and validated with Zod (`config/env.ts`) — the process terminates at boot if a required variable is missing.

| Variable | Required | Default | Notes |
|----------|:--------:|---------|-------|
| `DATABASE_URL` | ✅ | — | Supabase transaction pooler (6543, `?pgbouncer=true`) |
| `DIRECT_URL` | ✅ (migrate) | — | Supabase session pooler (5432); read by the Prisma CLI |
| `JWT_SECRET` | ✅ | — | HS256 signing key |
| `PORT` | — | `4000` | |
| `LINE_CHANNEL_SECRET` | — | `""` | webhook disabled if blank |
| `LINE_CHANNEL_TOKEN` | — | `""` | Messaging API |
| `LIFF_ID` | — | `""` | |
| `GOOGLE_APPS_SCRIPT_URL` | — | `""` | sheet logging disabled if blank |

---

## 7. Testing

- **Strategy:** e2e tests (Supertest) exercise real HTTP through a Nest app assembled with the same `configureApp` used in production — assertions act as contract tests.
- **Database:** always points at a local Postgres (`carekan_test`); `src/test/setup.ts` throws if `DATABASE_URL` is not localhost, because the suite calls `resetDb()`, which truncates every table.
- **Isolation:** `fileParallelism: false` (all files share the test database).
- **Coverage:** auth, hospitals, appointments, hospital-api, api-key schema, mappers, seed, health, LINE signature — 38 tests total.
- **Decorator metadata:** Vitest uses `unplugin-swc` as its transformer instead of esbuild (esbuild does not emit the `emitDecoratorMetadata` that Nest DI requires).

---

## 8. Build & Run

```
npm run dev        # tsc-watch → node dist/backend/src/main.js
npm run build      # tsc -p tsconfig.json
npm start          # node dist/backend/src/main.js
npm run typecheck  # tsc --noEmit
npm test           # vitest run (requires local Postgres)
```

Key compiler config: `module: Node16`, `experimentalDecorators`, `emitDecoratorMetadata`, `rootDir: ".."` (to import `shared/`, which lives outside `backend/`) → build output at `dist/backend/src/`.

---

## 9. Deployment

### 9.1 Supabase (Database)

Prisma requires two connections:

| Variable | Port | Used for | Reason |
|----------|------|----------|--------|
| `DATABASE_URL` | 6543 (transaction pooler) | runtime queries | conserves connections via PgBouncer |
| `DIRECT_URL` | 5432 (session pooler) | `prisma migrate` | migrations need session-level features the transaction pooler does not support |

`schema.prisma` declares both via `url` and `directUrl`.

### 9.2 Application (Railway / Render)

| Item | Value |
|------|-------|
| Build command | `npm run build` |
| Start command | `node dist/backend/src/main.js` |
| Release command | `prisma migrate deploy` |
| Health check | `GET /api/health` |
| Deployment model | long-lived Node process (not serverless) |

Post-deploy: update the LINE webhook URL to the new domain, and point the frontend (`VITE_API_BASE_URL`) at the new backend without changing frontend code.

### 9.3 Deployment Status
Application deployment is not yet done. The database (Supabase) is migrated and seeded.

---

## 10. Phase 1 — Migration Record

### 10.1 Outcome
Migrated Express → NestJS and Docker/Vercel Postgres → Supabase with no change to the API contract (§3), verified by:
- Test suite 38/38 passing.
- Contract regression 20/20 — status and body compared between the old Express and new NestJS servers matched on every case.
- End-to-end flow through the unchanged frontend: register → login → search → book → QR.

### 10.2 Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Keep Prisma (not supabase-js) | Supabase is standard Postgres; the existing schema and migrations apply unchanged |
| D2 | Keep in-house JWT (not Supabase Auth) | Supabase Auth is tied to email/phone and cannot authenticate by 13-digit national ID; adopting it would force frontend changes |
| D3 | `module: Node16` (CJS), not suffix-stripping | keeps all existing `.js` import suffixes, minimizing the change surface |
| D4 | Keep Vitest + `unplugin-swc` (do not port to Jest) | existing assertions need no changes → higher contract fidelity |
| D5 | Use `jsonwebtoken` directly, not `@nestjs/jwt` | ~15 lines of logic; not worth the extra dependency |
| D6 | Zod pipe, not `class-validator` | the error `details` shape must stay identical for the frontend |
| D7 | Railway/Render, not Vercel serverless | a long-lived process suits the Prisma connection pool and LINE raw-body handling |

### 10.3 Incidental Fixes
- The prior `rootDir` pointed one level above the repo root (`../..`), which broke `npm start` — corrected to `..`.
- `health.test.ts` had a stale assertion that did not match the actual response body — corrected.

---

## 11. Phase 2 — Feature Specification

Adds patient-journey features **additively** — the endpoints and contract in §3 do not change; new features are added as new modules, tables, and endpoints.

### 11.1 Feature Inventory

| # | Feature | Phase | Module | Foundation |
|---|---------|-------|--------|:----------:|
| 1 | Caregiver books on a patient's behalf | Before | `caregivers` | A |
| 2 | Suggest low-traffic time slots | Before | `hospitals` | — |
| 3 | Appointment reminders | Before | `notifications` | N |
| 4 | Entitlement (insurance rights) check | Before | `entitlement` | — |
| 5 | Required-documents checklist | Before | `appointments` | — |
| 6 | Check-in notification | During | `queue` | N |
| 7 | Real-time queue status | During | `queue` | R |
| 8 | Queue-delay notification | During | `queue` + `notifications` | R, N |
| 9 | Emergency / delay announcements | During | `announcements` | — |
| 10 | Notify caregiver on patient arrival | During | `caregivers` + `notifications` | A, N |
| 11 | Plain-language result explanation (LLM) | After | `records` | S |
| 12 | Medication reminders | After | `records` + `notifications` | N |
| 13 | Follow-up appointment reminders | After | `appointments` + `notifications` | N |
| 14 | Share results with family (consent) | After | `records` + `caregivers` | A, S |
| 15 | Document vault (slips / receipts / results) | After | `documents` | S |

**Foundations:** A = Caregiver / managed patient · N = Notification service · R = Real-time queue · S = Storage & records.

### 11.2 Foundation A — Managed Patient

Supports patients (e.g. the elderly) who have no account of their own, letting a caregiver book for them.

```prisma
model ManagedPatient {
  id         String   @id @default(cuid())
  guardianId String   @map("guardian_id")
  nationalId String   @map("national_id")
  firstName  String   @map("first_name")
  lastName   String   @map("last_name")
  birthDate  String   @map("birth_date")
  relation   String                          // parent | child | spouse | other
  consentAt  DateTime @map("consent_at")
  createdAt  DateTime @default(now()) @map("created_at")

  guardian   User     @relation(fields: [guardianId], references: [id])
  @@unique([guardianId, nationalId])
  @@map("managed_patients")
}
```

- `Reserve` gains a nullable `managedPatientId` column (null = self-booking → existing behavior unchanged).
- Endpoints: `GET|POST|DELETE /api/dependents`; `POST /api/appointments` accepts an optional `dependentId`.

### 11.3 Foundation N — Notification Service

```prisma
model NotificationPref {
  userId           String  @id @map("user_id")
  lineUserId       String? @map("line_user_id")
  remindBooking    Boolean @default(true) @map("remind_booking")
  remindMedication Boolean @default(true) @map("remind_medication")
  @@map("notification_prefs")
}

model NotificationLog {
  id       String   @id @default(cuid())
  userId   String   @map("user_id")
  kind     String                            // booking_reminder | queue_delay | ...
  channel  String                            // line | inapp
  sentAt   DateTime @default(now()) @map("sent_at")
  @@map("notification_logs")
}
```

- **Channel:** LINE Messaging API (`pushMessage`) — reuse the client in `line/`; bind `lineUserId` at login via LIFF.
- **Scheduler:** `@nestjs/schedule` (`@Cron`) scans `Reserve` rows approaching their date.
- **Idempotency:** check `NotificationLog` before sending.

### 11.4 Foundation R — Real-time Queue

```prisma
model QueueState {
  hospitalId String   @map("hospital_id")
  date       String
  nowServing String   @map("now_serving")    // A012
  updatedAt  DateTime @updatedAt @map("updated_at")
  @@id([hospitalId, date])
  @@map("queue_states")
}
```

- Hospitals update the current queue number via `PATCH /api/hospital/queue` (`x-api-key`).
- **Clients subscribe through Supabase Realtime** on the `queue_states` table (requires enabling Realtime + a read-only RLS policy).
- MVP fallback: `GET /api/hospitals/:id/queue?date=` by polling.

### 11.5 Foundation S — Records & Documents

```prisma
model MedicalRecord {
  id           String   @id @default(cuid())
  reserveId    String   @unique @map("reserve_id")
  summaryRaw   String   @map("summary_raw")
  summaryPlain String?  @map("summary_plain")   // LLM output; cached
  createdAt    DateTime @default(now()) @map("created_at")
  @@map("medical_records")
}

model Document {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  reserveId   String?  @map("reserve_id")
  type        String                            // appointment_slip | receipt | result | other
  storagePath String   @map("storage_path")
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("documents")
}
```

- Files are stored in Supabase Storage (private bucket); the backend returns short-lived signed URLs.
- LLM (feature 11): `POST /api/records/:id/explain` calls Claude (`claude-haiku-4-5` for cost/latency) to translate medical terminology into plain language, then stores `summaryPlain` (called once per record).

### 11.6 New Endpoints (additive)

| Method | Path | Auth | Feature |
|--------|------|------|:-------:|
| GET / POST / DELETE | `/api/dependents[/:id]` | JWT | 1 |
| GET | `/api/hospitals/:id/suggest-slots?date=` | — | 2 |
| GET / PUT | `/api/me/notification-prefs` | JWT | 3, 12 |
| GET | `/api/me/entitlement` | JWT | 4 |
| GET | `/api/appointments/:id/documents-required` | JWT | 5 |
| POST | `/api/appointments/:id/check-in` | JWT / `x-api-key` | 6 |
| GET | `/api/hospitals/:id/queue?date=` | — | 7 |
| PATCH | `/api/hospital/queue` | `x-api-key` | 7, 8 |
| GET | `/api/hospitals/:id/announcements` | — | 9 |
| POST | `/api/hospital/announcements` | `x-api-key` | 9 |
| GET | `/api/records/:id` | JWT | 11 |
| POST | `/api/records/:id/explain` | JWT | 11 |
| POST | `/api/records/:id/share` | JWT | 14 |
| GET | `/api/me/documents` | JWT | 15 |
| GET | `/api/documents/:id/url` | JWT | 15 |

Every endpoint that returns patient data must enforce ownership (the owner, or a guardian with consent), following the existing `getAppointmentForOwner` pattern.

### 11.7 Schema Changes Summary
- **New tables:** `managed_patients`, `notification_prefs`, `notification_logs`, `queue_states`, `medical_records`, `documents`, `announcements`.
- **Modified tables (nullable, additive):** `reserves.managed_patient_id`.
- Migrations run via `DIRECT_URL` (§9.1).

### 11.8 Sequencing

| Round | Work | Rationale |
|-------|------|-----------|
| 0 | Resolve §12 items 1 (booking race) and 5 → 2 (`/scanned/:id`) | prerequisites for real-time queue and privacy |
| 1 | Features 6 (check-in), 9 (announcements), 2 (suggest-slots) | data foundations mostly exist; fast to ship |
| 2 | Foundations N, R | unlock a large set of notification and queue features |
| 3 | Foundations A, S; features 11, 12, 14 | require new models and integrations |

### 11.9 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Enabling Realtime/Storage without RLS | anon key can read entire patient tables | write RLS policies as a prerequisite (§5.4) |
| LINE push quota (free tier) | reminders not fully delivered | rate-limit + in-app notification fallback |
| LLM cost/latency (feature 11) | high cost and response time | cache `summaryPlain`, use `claude-haiku-4-5` |
| PDPA — result data is sensitive (feature 14) | legal/compliance risk | require explicit consent + access audit log |
| Real entitlement check (feature 4) requires the NHSO API | external dependency | MVP: user self-declares, compared against `Hospital.rightsAccepted` |

---

## 12. Known Issues / Technical Debt

Pre-existing items to address before or during Phase 2, in priority order:

1. **Booking race condition** — `createAppointment`/`createReserve` use `count()` against `maxCapacity` under the default `READ COMMITTED` isolation; concurrent bookings can exceed capacity. Fix with a unique constraint or `Serializable`. **(highest priority — correctness)**
2. **`/api/scanned/:id` is public** — anyone who knows the `id` (a cuid) can read a patient's name. Use a signed token in the QR code. **(privacy)**
3. **`Schedule` is not linked to `Hospital`** — time slots are a shared template; supporting per-hospital opening hours requires a schema migration.
4. **`queueNumber` = `booked + 1`** — queue numbers can repeat after a cancellation.
5. **Duplicated booking logic** — the booking logic (`generateBookingCode`, `RESERVE_INCLUDE`, capacity check) is duplicated across `appointments` and `hospital-api`; consolidate into a single service.
6. **No rate limiting** on `/auth/login` or `/hospital/*` → `@nestjs/throttler`.
7. **No structured logging / request id** → `nestjs-pino`.
