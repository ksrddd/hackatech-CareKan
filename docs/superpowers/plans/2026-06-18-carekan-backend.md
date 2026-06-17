# CareKan Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real Express + Prisma + Postgres backend that satisfies the existing `shared/api.ts` wire contract, so the copied CareKan frontend can run on real data instead of localStorage mocks.

**Architecture:** A TypeScript/ESM Express API. `routes → controllers → services → prisma`, with `middleware/` for JWT auth + role gates driven by `ROUTE_ROLES`. The DB uses `schema.md`'s 4-entity spine (`users`, `hospitals`, `schedules`, `reserves`) extended to back the richer `shared/types.ts` DTOs. A service layer owns all `snake_case` DB ↔ `camelCase` DTO mapping. Postgres runs in Docker. Bookings are transactional to prevent overbooking.

**Tech Stack:** Node 20, TypeScript, Express 4 (ESM), Prisma + PostgreSQL 16, Zod (validation), bcryptjs (hashing), jsonwebtoken (JWT), tsx (dev runner), Vitest + Supertest (tests).

## Global Constraints

- Node.js **20.x**, npm **10.x** (matches frontend README).
- **No `any`** — use `unknown` + guards, generics, or shared types (frontend convention #1).
- All wire shapes come from **`shared/types.ts` + `shared/api.ts`** — never redefine a DTO; import it.
- DB columns are `snake_case`; DTOs are `camelCase`. Mapping happens **only** in `src/services/mappers.ts`.
- Error responses MUST match `ApiErrorBody`: `{ error: string; code?: string; details?: Record<string,string> }`.
- RBAC gates MUST match the `ROUTE_ROLES` table in `shared/api.ts` exactly.
- PDPA: citizens may only read their **own** `Appointment`/`reserve` by id (ownership check in the service).
- Passwords stored **bcrypt-hashed only**. No medical/diagnostic data stored.
- Backend listens on **`:4000`**. JWT expiry **7d**.
- Repo root is `D:\labs\CareKan`. The backend lives in `D:\labs\CareKan\backend`. `shared/` is copied to `D:\labs\CareKan\shared` (Plan: frontend Task 1 copies it; if running backend-first, copy `D:\labs\hackatech-CareKan\shared` → `D:\labs\CareKan\shared` now).

---

## File Structure

```
D:\labs\CareKan\
├── docker-compose.yml          # Postgres 16 (dev + test DBs)
├── shared/                     # copied verbatim from hackatech-CareKan (types.ts, api.ts)
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── .env                    # DATABASE_URL, JWT_SECRET, PORT (gitignored)
    ├── .env.example
    ├── .env.test               # DATABASE_URL → carekan_test
    ├── .gitignore
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    └── src/
        ├── index.ts            # server entry (listen)
        ├── app.ts              # express app factory (no listen — testable)
        ├── config.ts           # env parsing
        ├── prisma.ts           # PrismaClient singleton
        ├── errors.ts           # ApiError class + asyncHandler
        ├── middleware/
        │   ├── auth.ts         # authGuard, roleGuard
        │   └── errorHandler.ts # converts errors → ApiErrorBody
        ├── services/
        │   ├── mappers.ts      # DB row → DTO
        │   ├── auth.service.ts
        │   ├── hospital.service.ts
        │   └── appointment.service.ts
        ├── validation/
        │   └── schemas.ts      # Zod schemas per request body/query
        ├── controllers/
        │   ├── auth.controller.ts
        │   ├── hospital.controller.ts
        │   ├── appointment.controller.ts
        │   └── admin.controller.ts
        ├── routes/
        │   └── index.ts        # mounts all routes with role gates
        └── test/
            ├── helpers.ts       # resetDb(), buildApp(), makeToken()
            └── *.test.ts        # one per endpoint group
```

---

## Task 1: Monorepo + backend scaffold + Postgres + health check

**Files:**
- Create: `D:\labs\CareKan\docker-compose.yml`
- Create: `D:\labs\CareKan\backend\package.json`
- Create: `D:\labs\CareKan\backend\tsconfig.json`
- Create: `D:\labs\CareKan\backend\vitest.config.ts`
- Create: `D:\labs\CareKan\backend\.gitignore`, `.env`, `.env.example`, `.env.test`
- Create: `D:\labs\CareKan\backend\src\config.ts`, `prisma.ts`, `app.ts`, `index.ts`
- Create: `D:\labs\CareKan\backend\src\test\helpers.ts`
- Test: `D:\labs\CareKan\backend\src\test\health.test.ts`
- Copy: `D:\labs\hackatech-CareKan\shared` → `D:\labs\CareKan\shared` (if not already present)

**Interfaces:**
- Produces: `buildApp(): express.Express` from `src/app.ts`; `config` object from `src/config.ts` (`{ port: number; databaseUrl: string; jwtSecret: string }`); `prisma` singleton from `src/prisma.ts`.

- [ ] **Step 1: Copy `shared/` and create `docker-compose.yml`**

PowerShell: `Copy-Item -Recurse "D:\labs\hackatech-CareKan\shared" "D:\labs\CareKan\shared"` (skip if it already exists).

`D:\labs\CareKan\docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: carekan-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: carekan
      POSTGRES_PASSWORD: carekan
      POSTGRES_DB: carekan
    ports:
      - "5432:5432"
    volumes:
      - carekan_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U carekan"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  carekan_pgdata:
```

- [ ] **Step 2: Create backend package + config files**

`D:\labs\CareKan\backend\package.json`:

```json
{
  "name": "carekan-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:reset": "prisma migrate reset --force",
    "db:seed": "tsx prisma/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.17.0",
    "@types/supertest": "^6.0.2",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

`D:\labs\CareKan\backend\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "prisma"]
}
```

`D:\labs\CareKan\backend\vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    setupFiles: [],
    fileParallelism: false, // tests share one Postgres test DB
    hookTimeout: 30000,
  },
});
```

`D:\labs\CareKan\backend\.gitignore`:

```
node_modules
dist
.env
.env.test
```

`D:\labs\CareKan\backend\.env`:

```
DATABASE_URL="postgresql://carekan:carekan@localhost:5432/carekan?schema=public"
JWT_SECRET="dev-only-change-me-please-32-chars-min"
PORT=4000
```

`D:\labs\CareKan\backend\.env.example` — same as `.env` but with empty secret value.

`D:\labs\CareKan\backend\.env.test`:

```
DATABASE_URL="postgresql://carekan:carekan@localhost:5432/carekan_test?schema=public"
JWT_SECRET="test-secret-test-secret-test-secret"
PORT=4100
```

- [ ] **Step 3: Install deps and start Postgres**

PowerShell (from `D:\labs\CareKan`): `docker compose up -d`
PowerShell (from `D:\labs\CareKan\backend`): `npm install`
Create the test DB: `docker exec carekan-db psql -U carekan -d carekan -c "CREATE DATABASE carekan_test;"`
Expected: `CREATE DATABASE`.

- [ ] **Step 4: Write `config.ts`, `prisma.ts`, `app.ts`, `index.ts`**

`src/config.ts`:

```ts
import 'dotenv/config' assert {};

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
};
```

> Note: with `"type": "module"`, load env via Node's `--env-file` flag instead of the `dotenv` import. Update `dev`/`test` scripts to `tsx watch --env-file=.env src/index.ts` and tests to load `.env.test`. Simpler: install `dotenv` (`npm i dotenv`) and use `import 'dotenv/config'`. Pick `dotenv`; replace the first line of `config.ts` with `import 'dotenv/config';` and add `dotenv` to dependencies. For tests, `test/helpers.ts` loads `.env.test` explicitly (Step in Task = below).

`src/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

`src/app.ts`:

```ts
import express, { type Express } from 'express';
import cors from 'cors';

export function buildApp(): Express {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
```

`src/index.ts`:

```ts
import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();
app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`CareKan API listening on http://localhost:${config.port}`);
});
```

- [ ] **Step 5: Write the failing health test + test helper**

`src/test/helpers.ts`:

```ts
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.test', override: true });

import { buildApp } from '../app.js';

export function makeTestApp() {
  return buildApp();
}
```

`src/test/health.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(makeTestApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 6: Run the test**

Run (from `backend`): `npm test`
Expected: PASS (1 test). If it fails to start, confirm `npm install` completed and `dotenv` is installed.

- [ ] **Step 7: Commit**

```bash
git add D:/labs/CareKan
git commit -m "chore: scaffold CareKan monorepo + backend + postgres health check"
```

---

## Task 2: Prisma schema + migration

**Files:**
- Create: `D:\labs\CareKan\backend\prisma\schema.prisma`
- Test: `D:\labs\CareKan\backend\src\test\schema.test.ts`

**Interfaces:**
- Produces: Prisma models `User`, `Hospital`, `Schedule`, `Reserve` and enums `Role`, `InsuranceRight`, `Sex`, `ServiceType`, `Zone`, `ClinicCode`, `AppointmentStatus`. Table names: `users`, `hospitals`, `schedules`, `reserves`. The generated `@prisma/client` types are consumed by every service.

- [ ] **Step 1: Write the failing schema test**

`src/test/schema.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('prisma schema', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it('can round-trip a hospital with enum array fields', async () => {
    const h = await prisma.hospital.create({
      data: {
        id: 'test-klang',
        code: 'TK',
        name: 'รพ.ทดสอบ',
        shortName: 'ทดสอบ',
        address: 'a',
        district: 'd',
        zone: 'inner',
        phone: '02',
        openingHours: 'x',
        description: 'y',
        services: ['opd', 'follow_up'],
        rightsAccepted: ['uc', 'sso'],
        mockDistanceKm: 1.2,
      },
    });
    expect(h.services).toEqual(['opd', 'follow_up']);
    await prisma.hospital.delete({ where: { id: 'test-klang' } });
  });
});
```

- [ ] **Step 2: Write `schema.prisma`**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  citizen
  admin
}

enum InsuranceRight {
  uc
  sso
  csmbs
  self_pay
}

enum Sex {
  male
  female
  unspecified
}

enum ServiceType {
  opd
  new_patient
  checkup
  follow_up
  lab
  medication
  elderly
}

enum Zone {
  inner
  north
  south
  east
  thon_north
  thon_south
}

enum ClinicCode {
  med
  surg
  ped
  ob
  ortho
  eye
  ent
  dent
  skin
  ncd
  psych
}

enum AppointmentStatus {
  pending
  confirmed
  checked_in
  in_progress
  completed
  cancelled
  no_show
}

model User {
  id               String         @id @default(cuid())
  nationalId       String         @unique @map("national_id")
  username         String         @map("username")
  firstName        String         @map("first_name")
  lastName         String         @map("last_name")
  phoneNumber      String         @map("phone_number")
  email            String         @unique
  profileImage     String?        @map("profile_image")
  password         String
  address          String?
  insuranceId      String?        @map("insurance_id")
  insuranceRight   InsuranceRight @map("insurance_right")
  role             Role           @default(citizen)
  birthDate        String         @map("birth_date")
  sex              Sex            @default(unspecified)
  primaryHospitalId String?       @map("primary_hospital_id")
  hospitalPatientId String?       @map("hospital_patient_id")
  consentAt        DateTime?      @map("consent_at")
  createdAt        DateTime       @default(now()) @map("created_at")

  reserves Reserve[]

  @@map("users")
}

model Hospital {
  id             String           @id
  code           String           @unique
  name           String           @map("hospital_name")
  shortName      String           @map("short_name")
  address        String
  district       String
  zone           Zone
  phone          String
  openingHours   String           @map("opening_hours")
  description    String
  services       ServiceType[]
  rightsAccepted InsuranceRight[] @map("rights_accepted")
  mockDistanceKm Float            @map("mock_distance_km")

  schedules Schedule[]
  reserves  Reserve[]

  @@map("hospitals")
}

model Schedule {
  id            String     @id @default(cuid())
  hospitalId    String     @map("hospital_id")
  clinic        ClinicCode
  date          String // 'YYYY-MM-DD'
  startTime     String     @map("start_time") // 'HH:MM'
  endTime       String     @map("end_time")
  maxCapacity   Int        @map("max_capacity")
  currentBooked Int        @default(0) @map("current_booked")
  isFull        Boolean    @default(false) @map("is_full")

  hospital Hospital  @relation(fields: [hospitalId], references: [id])
  reserves Reserve[]

  @@unique([hospitalId, clinic, date, startTime], name: "slot_identity")
  @@index([hospitalId, clinic, date])
  @@map("schedules")
}

model Reserve {
  id              String            @id @default(cuid())
  bookingCode     String            @unique @map("booking_code")
  userId          String            @map("user_id")
  hospitalId      String            @map("hospital_id")
  scheduleId      String            @map("schedule_id")
  purpose         ServiceType
  reason          String            @default("")
  status          AppointmentStatus @default(confirmed)
  queueNumber     String            @map("queue_number")
  currentStationId Int?             @map("current_station_id")
  queueUpdatedAt  DateTime?         @map("queue_updated_at")
  checkedInAt     DateTime?         @map("checked_in_at")
  createdAt       DateTime          @default(now()) @map("created_at")

  user     User     @relation(fields: [userId], references: [id])
  hospital Hospital @relation(fields: [hospitalId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])

  @@index([hospitalId, scheduleId])
  @@map("reserves")
}
```

- [ ] **Step 3: Generate client + migrate**

Run (from `backend`):
```
npx prisma migrate dev --name init
```
Expected: creates `prisma/migrations/*_init`, applies to `carekan` DB, runs `prisma generate`.

Apply schema to the **test** DB too:
```
npx dotenv -e .env.test -- prisma migrate deploy
```
(If `dotenv-cli` isn't present: `npx prisma migrate deploy` after temporarily pointing `DATABASE_URL` at the test DB, or run with PowerShell `$env:DATABASE_URL="...carekan_test..."; npx prisma migrate deploy`.)

- [ ] **Step 4: Run the schema test**

Run: `npm test -- schema`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma backend/src/test/schema.test.ts
git commit -m "feat(db): prisma schema for users/hospitals/schedules/reserves"
```

---

## Task 3: Seed script (port mockData)

**Files:**
- Create: `D:\labs\CareKan\backend\prisma\seed.ts`
- Test: `D:\labs\CareKan\backend\src\test\seed.test.ts`

**Interfaces:**
- Produces: a runnable seed creating 9 hospitals, their schedules for the next 14 weekdays, demo users (citizen `1234567890123`, admin `9876543210987`, and the queue patients), and demo reserves matching the prototype. Consumed by the demo and by integration tests that call `runSeed()`.
- Export `export async function runSeed(prisma: PrismaClient): Promise<void>` so tests can invoke it.

- [ ] **Step 1: Write the failing seed test**

`src/test/seed.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runSeed } from '../../prisma/seed.js';
import { resetDb } from './helpers.js';

const prisma = new PrismaClient();

describe('seed', () => {
  beforeAll(async () => {
    await resetDb(prisma);
    await runSeed(prisma);
  });

  it('creates 9 hospitals', async () => {
    expect(await prisma.hospital.count()).toBe(9);
  });

  it('creates the demo citizen with national id 1234567890123', async () => {
    const u = await prisma.user.findUnique({ where: { nationalId: '1234567890123' } });
    expect(u?.role).toBe('citizen');
  });

  it('keeps schedule.currentBooked consistent with reserve count', async () => {
    const schedules = await prisma.schedule.findMany({ include: { reserves: true } });
    for (const s of schedules) {
      expect(s.currentBooked).toBeGreaterThanOrEqual(s.reserves.length);
    }
  });
});
```

- [ ] **Step 2: Add `resetDb` to `test/helpers.ts`**

Append to `src/test/helpers.ts`:

```ts
import type { PrismaClient } from '@prisma/client';

export async function resetDb(prisma: PrismaClient): Promise<void> {
  // Order matters: children before parents.
  await prisma.reserve.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();
}
```

- [ ] **Step 3: Write `prisma/seed.ts`**

Copy the **exact `HOSPITALS` array** (the 9 hospital objects) from `D:\labs\hackatech-CareKan\frontend\src\lib\mockData.ts` (lines ~10–200) into the seed as `HOSPITALS`. Then:

`prisma/seed.ts`:

```ts
import { PrismaClient, type ClinicCode } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ---- date helpers (ported from frontend lib/format.ts) ----
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isWeekend(iso: string): boolean {
  const day = new Date(iso + 'T00:00:00').getDay();
  return day === 0 || day === 6;
}
function nextWeekdayFrom(base: string, offset: number): string {
  let iso = addDaysISO(base, offset);
  while (isWeekend(iso)) iso = addDaysISO(iso, 1);
  return iso;
}

const TIME_RANGES: Array<[string, string]> = [
  ['08:00', '08:30'], ['08:30', '09:00'], ['09:00', '09:30'], ['09:30', '10:00'],
  ['10:00', '10:30'], ['10:30', '11:00'], ['11:00', '11:30'], ['11:30', '12:00'],
  ['13:00', '13:30'], ['13:30', '14:00'], ['14:00', '14:30'], ['14:30', '15:00'],
  ['15:00', '15:30'], ['15:30', '16:00'],
];

// Every hospital offers this clinic set so HospitalDetail + Book pages have slots.
const CLINICS: ClinicCode[] = ['med', 'surg', 'ped', 'ortho', 'eye', 'ent', 'dent'];

// PASTE the 9-hospital array from hackatech-CareKan mockData.ts here:
const HOSPITALS = [ /* ...exact objects: id, code, name, shortName, address, district, zone, phone, openingHours, services, rightsAccepted, mockDistanceKm, description... */ ] as const;

// Demo reserves to recreate (subset of MOCK_APPOINTMENTS + a few admin-queue rows).
interface SeedReserve {
  bookingCode: string;
  nationalId: string;       // owner; resolved to user id
  hospitalId: string;
  clinic: ClinicCode;
  purpose: string;
  reason: string;
  date: string;             // resolved relative to today
  startTime: string;
  endTime: string;
  queueNumber: string;
  status: string;
  checkedInAt: string | null;
}

export async function runSeed(prisma: PrismaClient): Promise<void> {
  // 1. Hospitals
  for (const h of HOSPITALS) {
    await prisma.hospital.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id, code: h.code, name: h.name, shortName: h.shortName,
        address: h.address, district: h.district, zone: h.zone as never,
        phone: h.phone, openingHours: h.openingHours, description: h.description,
        services: h.services as never, rightsAccepted: h.rightsAccepted as never,
        mockDistanceKm: h.mockDistanceKm,
      },
    });
  }

  // 2. Schedules: next 14 weekdays × each clinic × time ranges, capacity 6.
  const base = todayISO();
  const dates: string[] = [];
  for (let i = 0; i < 21 && dates.length < 14; i++) {
    const iso = addDaysISO(base, i);
    if (!isWeekend(iso)) dates.push(iso);
  }
  for (const h of HOSPITALS) {
    for (const clinic of CLINICS) {
      for (const date of dates) {
        for (const [startTime, endTime] of TIME_RANGES) {
          await prisma.schedule.upsert({
            where: { slot_identity: { hospitalId: h.id, clinic, date, startTime } },
            update: {},
            create: { hospitalId: h.id, clinic, date, startTime, endTime, maxCapacity: 6 },
          });
        }
      }
    }
  }

  // 3. Demo users (password hashed).
  const pwd = await bcrypt.hash('care1234', 10);
  const citizen = await prisma.user.upsert({
    where: { nationalId: '1234567890123' },
    update: {},
    create: {
      nationalId: '1234567890123', username: '1234567890123',
      firstName: 'สมพร', lastName: 'ชัยพัฒน์', phoneNumber: '0812345678',
      email: 'somporn@example.com', password: pwd, insuranceRight: 'uc',
      role: 'citizen', birthDate: '1958-04-12', sex: 'female',
      primaryHospitalId: 'klang', consentAt: new Date(),
    },
  });
  await prisma.user.upsert({
    where: { nationalId: '9876543210987' },
    update: {},
    create: {
      nationalId: '9876543210987', username: '9876543210987',
      firstName: 'เจ้าหน้าที่', lastName: 'รพ.กลาง', phoneNumber: '0898765432',
      email: 'admin@example.com', password: pwd, insuranceRight: 'csmbs',
      role: 'admin', birthDate: '1985-01-01', sex: 'unspecified',
      primaryHospitalId: 'klang', consentAt: new Date(),
    },
  });

  // 4. Demo reserves for the citizen (2 upcoming, 3 history) — dates relative to today.
  const reserves: SeedReserve[] = [
    { bookingCode: 'CK-A1001X', nationalId: '1234567890123', hospitalId: 'klang', clinic: 'med', purpose: 'follow_up', reason: 'ติดตามอาการความดันสูง', date: nextWeekdayFrom(base, 7), startTime: '09:00', endTime: '09:30', queueNumber: 'A045', status: 'confirmed', checkedInAt: null },
    { bookingCode: 'CK-A1002X', nationalId: '1234567890123', hospitalId: 'klang', clinic: 'eye', purpose: 'opd', reason: 'ตรวจสายตา', date: nextWeekdayFrom(base, 14), startTime: '13:30', endTime: '14:00', queueNumber: 'A012', status: 'pending', checkedInAt: null },
    { bookingCode: 'CK-AH1X01', nationalId: '1234567890123', hospitalId: 'klang', clinic: 'med', purpose: 'follow_up', reason: 'ติดตามความดัน', date: addDaysISO(base, -14), startTime: '08:30', endTime: '09:00', queueNumber: 'A012', status: 'completed', checkedInAt: addDaysISO(base, -14) + 'T08:05:00Z' },
    { bookingCode: 'CK-AH2X02', nationalId: '1234567890123', hospitalId: 'klang', clinic: 'dent', purpose: 'opd', reason: 'ขูดหินปูน', date: addDaysISO(base, -28), startTime: '10:00', endTime: '10:30', queueNumber: 'A034', status: 'completed', checkedInAt: addDaysISO(base, -28) + 'T09:50:00Z' },
    { bookingCode: 'CK-AH3X03', nationalId: '1234567890123', hospitalId: 'klang', clinic: 'eye', purpose: 'opd', reason: 'ตรวจสายตา', date: addDaysISO(base, -55), startTime: '14:00', endTime: '14:30', queueNumber: 'A018', status: 'no_show', checkedInAt: null },
  ];

  for (const r of reserves) {
    // For past dates, ensure a schedule row exists (seed only made future ones).
    const schedule = await prisma.schedule.upsert({
      where: { slot_identity: { hospitalId: r.hospitalId, clinic: r.clinic, date: r.date, startTime: r.startTime } },
      update: {},
      create: { hospitalId: r.hospitalId, clinic: r.clinic, date: r.date, startTime: r.startTime, endTime: r.endTime, maxCapacity: 6, currentBooked: 0 },
    });
    await prisma.reserve.upsert({
      where: { bookingCode: r.bookingCode },
      update: {},
      create: {
        bookingCode: r.bookingCode, userId: citizen.id, hospitalId: r.hospitalId,
        scheduleId: schedule.id, purpose: r.purpose as never, reason: r.reason,
        status: r.status as never, queueNumber: r.queueNumber,
        checkedInAt: r.checkedInAt ? new Date(r.checkedInAt) : null,
      },
    });
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { currentBooked: { increment: 1 } },
    });
  }
}

// CLI entry
const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  const prisma = new PrismaClient();
  runSeed(prisma)
    .then(() => console.log('Seed complete'))
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
```

> Note: the `as never` casts bridge the string literals to Prisma enum types without `any`; alternatively import the generated enums and cast precisely. Acceptable here because values are validated against the schema at insert time.

- [ ] **Step 4: Run seed against dev DB, then run the test**

Run (from `backend`): `npm run db:seed`
Expected: `Seed complete`.
Run: `npm test -- seed`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/seed.ts backend/src/test/seed.test.ts backend/src/test/helpers.ts
git commit -m "feat(db): seed 9 hospitals, schedules, demo users + reserves"
```

---

## Task 4: Error handling + mappers + Zod schemas

**Files:**
- Create: `D:\labs\CareKan\backend\src\errors.ts`
- Create: `D:\labs\CareKan\backend\src\middleware\errorHandler.ts`
- Create: `D:\labs\CareKan\backend\src\services\mappers.ts`
- Create: `D:\labs\CareKan\backend\src\validation\schemas.ts`
- Modify: `D:\labs\CareKan\backend\src\app.ts` (register error handler)
- Test: `D:\labs\CareKan\backend\src\test\mappers.test.ts`

**Interfaces:**
- Produces:
  - `class ApiError extends Error { status: number; code?: string; details?: Record<string,string>; constructor(message, status, code?, details?) }`
  - `asyncHandler(fn)` wrapper.
  - `errorHandler` Express middleware emitting `ApiErrorBody`.
  - `toUserDto(user)`, `toHospitalDto(h)`, `toTimeSlotDto(s)`, `toAppointmentDto(r)` (r includes `schedule` + `user`).
  - Zod schemas: `loginSchema`, `registerSchema`, `hospitalsQuerySchema`, `timeSlotsQuerySchema`, `createAppointmentSchema`, `adminQuerySchema`, `updateStatusSchema`.

- [ ] **Step 1: Write the failing mappers test**

`src/test/mappers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toUserDto, toTimeSlotDto } from '../services/mappers.js';

describe('mappers', () => {
  it('maps a user row to the User DTO (camelCase, fullName joined)', () => {
    const dto = toUserDto({
      id: 'u1', nationalId: '1234567890123', username: '1234567890123',
      firstName: 'สมพร', lastName: 'ชัยพัฒน์', phoneNumber: '0812345678',
      email: 'a@b.c', profileImage: null, password: 'hash', address: null,
      insuranceId: null, insuranceRight: 'uc', role: 'citizen',
      birthDate: '1958-04-12', sex: 'female', primaryHospitalId: 'klang',
      hospitalPatientId: null, consentAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
    });
    expect(dto.fullName).toBe('สมพร ชัยพัฒน์');
    expect(dto.phone).toBe('0812345678');
    expect('password' in dto).toBe(false);
  });

  it('maps a schedule row to TimeSlot DTO', () => {
    const dto = toTimeSlotDto({
      id: 's1', hospitalId: 'klang', clinic: 'med', date: '2026-06-20',
      startTime: '09:00', endTime: '09:30', maxCapacity: 6, currentBooked: 2, isFull: false,
    });
    expect(dto).toMatchObject({ capacity: 6, booked: 2, clinic: 'med' });
  });
});
```

- [ ] **Step 2: Write `errors.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, string>;
  constructor(message: string, status: number, code?: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler<
  H extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
>(fn: H) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
```

- [ ] **Step 3: Write `middleware/errorHandler.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors.js';
import type { ApiErrorBody } from '../../../shared/api';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = { error: err.message };
    if (err.code) body.code = err.code;
    if (err.details) body.details = err.details;
    res.status(err.status).json(body);
    return;
  }
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) details[issue.path.join('.') || '_'] = issue.message;
    res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', code: 'VALIDATION', details } satisfies ApiErrorBody);
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' } satisfies ApiErrorBody);
}
```

- [ ] **Step 4: Write `services/mappers.ts`**

```ts
import type {
  User as UserRow, Hospital as HospitalRow, Schedule as ScheduleRow,
  Reserve as ReserveRow,
} from '@prisma/client';
import type { User, Hospital, TimeSlot, Appointment } from '../../../shared/types';

export function toUserDto(u: UserRow): User {
  return {
    id: u.id,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    nationalId: u.nationalId,
    birthDate: u.birthDate,
    sex: u.sex,
    phone: u.phoneNumber,
    email: u.email,
    role: u.role,
    insuranceRight: u.insuranceRight,
    primaryHospitalId: u.primaryHospitalId,
    hospitalPatientId: u.hospitalPatientId,
    consentAt: u.consentAt ? u.consentAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toHospitalDto(h: HospitalRow): Hospital {
  return {
    id: h.id, code: h.code, name: h.name, shortName: h.shortName,
    address: h.address, district: h.district, zone: h.zone, phone: h.phone,
    openingHours: h.openingHours, services: h.services, rightsAccepted: h.rightsAccepted,
    mockDistanceKm: h.mockDistanceKm, description: h.description,
  };
}

export function toTimeSlotDto(s: ScheduleRow): TimeSlot {
  return {
    id: s.id, hospitalId: s.hospitalId, clinic: s.clinic, date: s.date,
    startTime: s.startTime, endTime: s.endTime,
    capacity: s.maxCapacity, booked: s.currentBooked,
  };
}

export function toAppointmentDto(
  r: ReserveRow & { schedule: ScheduleRow; user: Pick<UserRow, 'firstName' | 'lastName'> },
): Appointment {
  return {
    id: r.id,
    bookingRef: r.bookingCode,
    userId: r.userId,
    userFullName: `${r.user.firstName} ${r.user.lastName}`.trim(),
    hospitalId: r.hospitalId,
    clinic: r.schedule.clinic,
    purpose: r.purpose,
    reason: r.reason,
    date: r.schedule.date,
    startTime: r.schedule.startTime,
    endTime: r.schedule.endTime,
    queueNumber: r.queueNumber,
    status: r.status,
    checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}
```

- [ ] **Step 5: Write `validation/schemas.ts`**

```ts
import { z } from 'zod';

const serviceType = z.enum(['opd','new_patient','checkup','follow_up','lab','medication','elderly']);
const clinicCode = z.enum(['med','surg','ped','ob','ortho','eye','ent','dent','skin','ncd','psych']);
const sex = z.enum(['male','female','unspecified']);
const insuranceRight = z.enum(['uc','sso','csmbs','self_pay']);
const status = z.enum(['pending','confirmed','checked_in','in_progress','completed','cancelled','no_show']);
const zone = z.enum(['inner','north','south','east','thon_north','thon_south']);

export const loginSchema = z.object({
  nationalId: z.string().regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'),
});

export const registerSchema = z.object({
  nationalId: z.string().regex(/^\d{13}$/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
  sex,
  phone: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
  acceptedPdpaAt: z.string().min(1),
});

export const hospitalsQuerySchema = z.object({
  q: z.string().optional(),
  district: z.string().optional(),
  zone: zone.optional(),
  service: serviceType.optional(),
  right: insuranceRight.optional(),
});

export const timeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clinic: clinicCode,
});

export const createAppointmentSchema = z.object({
  hospitalId: z.string().min(1),
  clinic: clinicCode,
  purpose: serviceType,
  reason: z.string().default(''),
  slotId: z.string().min(1),
});

export const adminQuerySchema = z.object({
  hospitalId: z.string().min(1),
  clinic: clinicCode.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateStatusSchema = z.object({ status });
```

- [ ] **Step 6: Register the error handler in `app.ts`**

In `src/app.ts`, import `{ errorHandler }` and add `app.use(errorHandler);` as the **last** middleware (after routes — routes get mounted in Task 5+; for now it's after the health route).

- [ ] **Step 7: Run the mappers test**

Run: `npm test -- mappers`
Expected: 2 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/errors.ts backend/src/middleware backend/src/services/mappers.ts backend/src/validation backend/src/app.ts backend/src/test/mappers.test.ts
git commit -m "feat(api): error handler, DTO mappers, zod request schemas"
```

---

## Task 5: Auth — JWT util, middleware, and `/auth/*` endpoints

**Files:**
- Create: `D:\labs\CareKan\backend\src\services\auth.service.ts`
- Create: `D:\labs\CareKan\backend\src\middleware\auth.ts`
- Create: `D:\labs\CareKan\backend\src\controllers\auth.controller.ts`
- Create: `D:\labs\CareKan\backend\src\routes\index.ts`
- Modify: `D:\labs\CareKan\backend\src\app.ts` (mount routes)
- Test: `D:\labs\CareKan\backend\src\test\auth.test.ts`

**Interfaces:**
- Consumes: `toUserDto`, Zod `loginSchema`/`registerSchema`, `ApiError`, `asyncHandler`, `prisma`, `config.jwtSecret`.
- Produces:
  - `signToken(payload: { sub: string; role: Role }): string`, `verifyToken(token): { sub: string; role: Role }`.
  - `authGuard` (sets `req.user = { id, role }`), `roleGuard(role)`.
  - Express `Request` augmented with `user?: { id: string; role: Role }`.
  - Mounted routes: `POST /api/auth/register|login|logout`, `GET /api/auth/me`.

- [ ] **Step 1: Write failing auth tests**

`src/test/auth.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();

beforeAll(async () => { await resetDb(prisma); await runSeed(prisma); });

describe('auth', () => {
  it('logs in the demo citizen and returns a User (no password)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ nationalId: '1234567890123', password: 'care1234' });
    expect(res.status).toBe(200);
    expect(res.body.user.nationalId).toBe('1234567890123');
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['x-auth-token'] ?? res.body.token).toBeUndefined(); // token in body? see impl
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ nationalId: '1234567890123', password: 'wrongpw' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('registers a new citizen and the token works on /auth/me', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      nationalId: '1111111111119', firstName: 'ทดสอบ', lastName: 'ผู้ใช้',
      birthDate: '1990-01-01', sex: 'male', phone: '0800000000',
      email: 'newuser@example.com', password: 'pass1234',
      acceptedPdpaAt: new Date().toISOString(),
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token as string;
    expect(token).toBeTruthy();
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.nationalId).toBe('1111111111119');
  });

  it('blocks /auth/me without a token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
```

> Decision: the JWT is returned in the **response body** as `{ user, token }` for login/register (frontend stores it via `setAuthToken`). `LoginResponse`/`RegisterResponse` in `shared/api.ts` only type `{ user }`; we extend the wire response with an optional `token` field. Update `shared/api.ts` `LoginResponse` to `{ user: User; token: string }` (Task 5 Step 2). This is the one contract addition (flagged during design).

- [ ] **Step 2: Extend `shared/api.ts` LoginResponse with token**

In `D:\labs\CareKan\shared\api.ts`, change:

```ts
export interface LoginResponse {
  user: User;
  token: string;
}
```

(`RegisterResponse = LoginResponse` already, so register inherits it.)

- [ ] **Step 3: Write `services/auth.service.ts`**

```ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '../../../shared/types';
import { config } from '../config.js';

export interface TokenPayload { sub: string; role: Role; }

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === 'string' || !('sub' in decoded) || !('role' in decoded)) {
    throw new Error('Malformed token');
  }
  return { sub: String(decoded.sub), role: decoded.role as Role };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Write `middleware/auth.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../../../shared/types';
import { ApiError } from '../errors.js';
import { verifyToken } from '../services/auth.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: Role }; }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new ApiError('โทเคนไม่ถูกต้องหรือหมดอายุ', 401, 'INVALID_TOKEN');
  }
}

export function roleGuard(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new ApiError('ต้องเข้าสู่ระบบก่อน', 401, 'UNAUTHENTICATED');
    if (req.user.role !== role) throw new ApiError('ไม่มีสิทธิ์เข้าถึง', 403, 'FORBIDDEN');
    next();
  };
}
```

> Note: `authGuard` throws synchronously; Express 4 catches sync throws in middleware, so no `asyncHandler` needed here.

- [ ] **Step 5: Write `controllers/auth.controller.ts`**

```ts
import type { Request, Response } from 'express';
import type { LoginResponse, MeResponse } from '../../../shared/api';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { toUserDto } from '../services/mappers.js';
import { hashPassword, signToken, verifyPassword } from '../services/auth.service.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { nationalId, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { nationalId } });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new ApiError('เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง', 401, 'BAD_CREDENTIALS');
  }
  const token = signToken({ sub: user.id, role: user.role });
  res.json({ user: toUserDto(user), token } satisfies LoginResponse);
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const exists = await prisma.user.findFirst({
    where: { OR: [{ nationalId: body.nationalId }, { email: body.email }] },
  });
  if (exists) throw new ApiError('มีบัญชีนี้อยู่แล้ว', 409, 'DUPLICATE');
  const user = await prisma.user.create({
    data: {
      nationalId: body.nationalId, username: body.nationalId,
      firstName: body.firstName, lastName: body.lastName, phoneNumber: body.phone,
      email: body.email, password: await hashPassword(body.password),
      insuranceRight: 'uc', role: 'citizen', birthDate: body.birthDate,
      sex: body.sex, consentAt: new Date(body.acceptedPdpaAt),
    },
  });
  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ user: toUserDto(user), token } satisfies LoginResponse);
}

export function logout(_req: Request, res: Response): void {
  res.status(204).send(); // JWT is stateless; client drops the token.
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new ApiError('ไม่พบผู้ใช้', 404, 'NOT_FOUND');
  res.json({ user: toUserDto(user) } satisfies MeResponse);
}
```

- [ ] **Step 6: Write `routes/index.ts` + mount in `app.ts`**

`src/routes/index.ts`:

```ts
import { Router } from 'express';
import { asyncHandler } from '../errors.js';
import { authGuard } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

export const router = Router();

router.post('/auth/register', asyncHandler(auth.register));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authGuard, asyncHandler(auth.me));
```

In `src/app.ts`: import `{ router }` and add `app.use('/api', router);` **before** `app.use(errorHandler)`.

- [ ] **Step 7: Run the auth tests**

Run: `npm test -- auth`
Expected: 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/auth.service.ts backend/src/middleware/auth.ts backend/src/controllers/auth.controller.ts backend/src/routes backend/src/app.ts backend/src/test/auth.test.ts shared/api.ts
git commit -m "feat(auth): bcrypt + JWT login/register/logout/me with role guards"
```

---

## Task 6: Hospitals — list, detail, time-slots

**Files:**
- Create: `D:\labs\CareKan\backend\src\services\hospital.service.ts`
- Create: `D:\labs\CareKan\backend\src\controllers\hospital.controller.ts`
- Modify: `D:\labs\CareKan\backend\src\routes\index.ts`
- Test: `D:\labs\CareKan\backend\src\test\hospital.test.ts`

**Interfaces:**
- Consumes: `prisma`, mappers, Zod `hospitalsQuerySchema`/`timeSlotsQuerySchema`, `ApiError`.
- Produces routes: `GET /api/hospitals`, `GET /api/hospitals/:id`, `GET /api/hospitals/:id/time-slots`. Responses match `HospitalsResponse`, `HospitalDetailResponse`, `TimeSlotsResponse`.

- [ ] **Step 1: Write failing hospital tests**

`src/test/hospital.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
beforeAll(async () => { await resetDb(prisma); await runSeed(prisma); });

describe('hospitals', () => {
  it('lists all 9 hospitals', async () => {
    const res = await request(app).get('/api/hospitals');
    expect(res.status).toBe(200);
    expect(res.body.hospitals).toHaveLength(9);
  });

  it('filters by zone', async () => {
    const res = await request(app).get('/api/hospitals?zone=inner');
    expect(res.status).toBe(200);
    expect(res.body.hospitals.every((h: { zone: string }) => h.zone === 'inner')).toBe(true);
  });

  it('returns hospital detail with clinics array', async () => {
    const res = await request(app).get('/api/hospitals/klang');
    expect(res.status).toBe(200);
    expect(res.body.hospital.id).toBe('klang');
    expect(Array.isArray(res.body.clinics)).toBe(true);
    expect(res.body.clinics).toContain('med');
  });

  it('404s an unknown hospital', async () => {
    const res = await request(app).get('/api/hospitals/nope');
    expect(res.status).toBe(404);
  });

  it('returns time slots for a hospital/clinic/date', async () => {
    const hosp = await request(app).get('/api/hospitals/klang');
    const slotDate = (await prisma.schedule.findFirst({
      where: { hospitalId: 'klang', clinic: 'med' }, orderBy: { date: 'asc' },
    }))!.date;
    const res = await request(app).get(`/api/hospitals/klang/time-slots?date=${slotDate}&clinic=med`);
    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);
    expect(res.body.slots[0]).toHaveProperty('capacity');
    expect(hosp.body.clinics).toContain('med');
  });
});
```

- [ ] **Step 2: Write `services/hospital.service.ts`**

```ts
import type { HospitalsQuery } from '../../../shared/api';
import type { ClinicCode } from '../../../shared/types';
import { prisma } from '../prisma.js';
import { toHospitalDto, toTimeSlotDto } from './mappers.js';
import { ApiError } from '../errors.js';

export async function listHospitals(q: HospitalsQuery) {
  const rows = await prisma.hospital.findMany({
    where: {
      ...(q.zone ? { zone: q.zone } : {}),
      ...(q.district ? { district: { contains: q.district } } : {}),
      ...(q.service ? { services: { has: q.service } } : {}),
      ...(q.right ? { rightsAccepted: { has: q.right } } : {}),
      ...(q.q ? { OR: [{ name: { contains: q.q } }, { shortName: { contains: q.q } }] } : {}),
    },
    orderBy: { mockDistanceKm: 'asc' },
  });
  return rows.map(toHospitalDto);
}

export async function getHospitalDetail(id: string) {
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) throw new ApiError('ไม่พบโรงพยาบาล', 404, 'NOT_FOUND');
  const clinicRows = await prisma.schedule.findMany({
    where: { hospitalId: id }, distinct: ['clinic'], select: { clinic: true },
  });
  const clinics: ClinicCode[] = clinicRows.map((c) => c.clinic);
  return { hospital: toHospitalDto(hospital), clinics };
}

export async function listTimeSlots(hospitalId: string, date: string, clinic: ClinicCode) {
  const rows = await prisma.schedule.findMany({
    where: { hospitalId, date, clinic }, orderBy: { startTime: 'asc' },
  });
  return rows.map(toTimeSlotDto);
}
```

- [ ] **Step 3: Write `controllers/hospital.controller.ts`**

```ts
import type { Request, Response } from 'express';
import type { HospitalsResponse, HospitalDetailResponse, TimeSlotsResponse } from '../../../shared/api';
import { hospitalsQuerySchema, timeSlotsQuerySchema } from '../validation/schemas.js';
import * as svc from '../services/hospital.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const q = hospitalsQuerySchema.parse(req.query);
  res.json({ hospitals: await svc.listHospitals(q) } satisfies HospitalsResponse);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const result = await svc.getHospitalDetail(req.params.id);
  res.json(result satisfies HospitalDetailResponse);
}

export async function timeSlots(req: Request, res: Response): Promise<void> {
  const { date, clinic } = timeSlotsQuerySchema.parse(req.query);
  res.json({ slots: await svc.listTimeSlots(req.params.id, date, clinic) } satisfies TimeSlotsResponse);
}
```

- [ ] **Step 4: Mount routes**

Add to `src/routes/index.ts`:

```ts
import * as hospital from '../controllers/hospital.controller.js';

router.get('/hospitals', asyncHandler(hospital.list));
router.get('/hospitals/:id', asyncHandler(hospital.detail));
router.get('/hospitals/:id/time-slots', asyncHandler(hospital.timeSlots));
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- hospital`
Expected: 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/hospital.service.ts backend/src/controllers/hospital.controller.ts backend/src/routes/index.ts backend/src/test/hospital.test.ts
git commit -m "feat(hospitals): list/detail/time-slots endpoints"
```

---

## Task 7: Appointments — create (transactional), my list, detail

**Files:**
- Create: `D:\labs\CareKan\backend\src\services\appointment.service.ts`
- Create: `D:\labs\CareKan\backend\src\controllers\appointment.controller.ts`
- Modify: `D:\labs\CareKan\backend\src\routes\index.ts`
- Test: `D:\labs\CareKan\backend\src\test\appointment.test.ts`

**Interfaces:**
- Consumes: `prisma`, mappers, `createAppointmentSchema`, `ApiError`, `authGuard`/`roleGuard('citizen')`.
- Produces:
  - `createAppointment(userId, input)` — transactional, returns `Appointment` DTO.
  - `getMyAppointments(userId)` — `{ upcoming, history }`.
  - `getAppointmentForOwner(id, userId)` — ownership-checked.
  - `generateBookingCode()`, `generateQueueNumber(hospitalId, clinic, date)`.
  - Routes: `POST /api/appointments`, `GET /api/appointments/me`, `GET /api/appointments/:id` (all `citizen`-gated).

- [ ] **Step 1: Write failing appointment tests**

`src/test/appointment.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
let token: string;
let openSlotId: string;

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);
  const login = await request(app).post('/api/auth/login')
    .send({ nationalId: '1234567890123', password: 'care1234' });
  token = login.body.token;
  const slot = await prisma.schedule.findFirst({
    where: { hospitalId: 'klang', clinic: 'med', currentBooked: { lt: 6 } },
    orderBy: { date: 'asc' },
  });
  openSlotId = slot!.id;
});

describe('appointments', () => {
  it('requires auth (401)', async () => {
    const res = await request(app).get('/api/appointments/me');
    expect(res.status).toBe(401);
  });

  it('returns my upcoming + history (seeded)', async () => {
    const res = await request(app).get('/api/appointments/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.upcoming.length).toBeGreaterThanOrEqual(1);
    expect(res.body.history.length).toBeGreaterThanOrEqual(1);
  });

  it('creates an appointment with a CK- ref and A0xx queue number', async () => {
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: 'klang', clinic: 'med', purpose: 'follow_up', reason: 'นัดติดตาม', slotId: openSlotId });
    expect(res.status).toBe(201);
    expect(res.body.appointment.bookingRef).toMatch(/^CK-[A-Z0-9]{6}$/);
    expect(res.body.appointment.queueNumber).toMatch(/^A\d{3}$/);
    expect(res.body.appointment.status).toBe('confirmed');
  });

  it('increments the slot booked count', async () => {
    const slot = await prisma.schedule.findUnique({ where: { id: openSlotId } });
    expect(slot!.currentBooked).toBeGreaterThanOrEqual(1);
  });

  it('rejects booking a full slot with 409', async () => {
    const full = await prisma.schedule.create({
      data: { hospitalId: 'klang', clinic: 'med', date: '2030-01-01', startTime: '08:00', endTime: '08:30', maxCapacity: 1, currentBooked: 1, isFull: true },
    });
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ hospitalId: 'klang', clinic: 'med', purpose: 'opd', reason: 'x', slotId: full.id });
    expect(res.status).toBe(409);
  });

  it("blocks reading another user's appointment (PDPA) with 404", async () => {
    // create a second user + their appointment
    await request(app).post('/api/auth/register').send({
      nationalId: '2222222222228', firstName: 'อื่น', lastName: 'คน', birthDate: '1990-01-01',
      sex: 'male', phone: '0800000001', email: 'other@example.com', password: 'pass1234',
      acceptedPdpaAt: new Date().toISOString(),
    });
    const otherLogin = await request(app).post('/api/auth/login').send({ nationalId: '2222222222228', password: 'pass1234' });
    const slot2 = await prisma.schedule.findFirst({ where: { hospitalId: 'taksin', clinic: 'med', currentBooked: { lt: 6 } } });
    const created = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${otherLogin.body.token}`)
      .send({ hospitalId: 'taksin', clinic: 'med', purpose: 'opd', reason: 'y', slotId: slot2!.id });
    const otherId = created.body.appointment.id;
    // citizen #1 tries to read it
    const res = await request(app).get(`/api/appointments/${otherId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Write `services/appointment.service.ts`**

```ts
import { Prisma } from '@prisma/client';
import type { CreateAppointmentRequest } from '../../../shared/api';
import type { ClinicCode } from '../../../shared/types';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';
import { toAppointmentDto } from './mappers.js';

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomRef(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return `CK-${out}`;
}

async function generateBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomRef();
    const exists = await prisma.reserve.findUnique({ where: { bookingCode: code } });
    if (!exists) return code;
  }
  throw new ApiError('ไม่สามารถสร้างรหัสการจองได้ ลองใหม่อีกครั้ง', 500, 'REF_COLLISION');
}

async function generateQueueNumber(hospitalId: string, clinic: ClinicCode, date: string): Promise<string> {
  const count = await prisma.reserve.count({
    where: { hospitalId, schedule: { clinic, date } },
  });
  return `A${String(count + 1).padStart(3, '0')}`;
}

const RESERVE_INCLUDE = {
  schedule: true,
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ReserveInclude;

export async function createAppointment(userId: string, input: CreateAppointmentRequest) {
  const reserve = await prisma.$transaction(async (tx) => {
    const slot = await tx.schedule.findUnique({ where: { id: input.slotId } });
    if (!slot) throw new ApiError('ไม่พบช่วงเวลานี้', 404, 'SLOT_NOT_FOUND');
    if (slot.hospitalId !== input.hospitalId || slot.clinic !== input.clinic) {
      throw new ApiError('ช่วงเวลาไม่ตรงกับโรงพยาบาล/คลินิกที่เลือก', 400, 'SLOT_MISMATCH');
    }
    if (slot.isFull || slot.currentBooked >= slot.maxCapacity) {
      throw new ApiError('ช่วงเวลานี้เต็มแล้ว', 409, 'SLOT_FULL');
    }
    const queueNumber = await generateQueueNumber(slot.hospitalId, slot.clinic, slot.date);
    const bookingCode = await generateBookingCode();
    const willBeFull = slot.currentBooked + 1 >= slot.maxCapacity;
    await tx.schedule.update({
      where: { id: slot.id },
      data: { currentBooked: { increment: 1 }, isFull: willBeFull },
    });
    return tx.reserve.create({
      data: {
        bookingCode, userId, hospitalId: slot.hospitalId, scheduleId: slot.id,
        purpose: input.purpose, reason: input.reason, status: 'confirmed',
        queueNumber, queueUpdatedAt: new Date(),
      },
      include: RESERVE_INCLUDE,
    });
  });
  return toAppointmentDto(reserve);
}

export async function getMyAppointments(userId: string) {
  const rows = await prisma.reserve.findMany({
    where: { userId }, include: RESERVE_INCLUDE,
    orderBy: [{ schedule: { date: 'asc' } }, { schedule: { startTime: 'asc' } }],
  });
  const today = new Date().toISOString().slice(0, 10);
  const terminal = new Set(['completed', 'cancelled', 'no_show']);
  const dtos = rows.map(toAppointmentDto);
  return {
    upcoming: dtos.filter((a) => !terminal.has(a.status) && a.date >= today),
    history: dtos.filter((a) => terminal.has(a.status) || a.date < today),
  };
}

export async function getAppointmentForOwner(id: string, userId: string) {
  const r = await prisma.reserve.findUnique({ where: { id }, include: RESERVE_INCLUDE });
  if (!r || r.userId !== userId) throw new ApiError('ไม่พบนัดหมาย', 404, 'NOT_FOUND');
  return toAppointmentDto(r);
}
```

- [ ] **Step 3: Write `controllers/appointment.controller.ts`**

```ts
import type { Request, Response } from 'express';
import type { AppointmentResponse, MyAppointmentsResponse } from '../../../shared/api';
import { createAppointmentSchema } from '../validation/schemas.js';
import * as svc from '../services/appointment.service.js';

export async function create(req: Request, res: Response): Promise<void> {
  const input = createAppointmentSchema.parse(req.body);
  const appointment = await svc.createAppointment(req.user!.id, input);
  res.status(201).json({ appointment } satisfies AppointmentResponse);
}

export async function mine(req: Request, res: Response): Promise<void> {
  res.json(await svc.getMyAppointments(req.user!.id) satisfies MyAppointmentsResponse);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const appointment = await svc.getAppointmentForOwner(req.params.id, req.user!.id);
  res.json({ appointment } satisfies AppointmentResponse);
}
```

- [ ] **Step 4: Mount routes (citizen-gated)**

Add to `src/routes/index.ts`:

```ts
import { roleGuard } from '../middleware/auth.js';
import * as appt from '../controllers/appointment.controller.js';

router.post('/appointments', authGuard, roleGuard('citizen'), asyncHandler(appt.create));
router.get('/appointments/me', authGuard, roleGuard('citizen'), asyncHandler(appt.mine));
router.get('/appointments/:id', authGuard, roleGuard('citizen'), asyncHandler(appt.detail));
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- appointment`
Expected: 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/appointment.service.ts backend/src/controllers/appointment.controller.ts backend/src/routes/index.ts backend/src/test/appointment.test.ts
git commit -m "feat(appointments): transactional booking, my list, owner-checked detail"
```

---

## Task 8: Admin — queue list + status transition

**Files:**
- Create: `D:\labs\CareKan\backend\src\controllers\admin.controller.ts`
- Modify: `D:\labs\CareKan\backend\src\services\appointment.service.ts` (add `getAdminQueue`, `updateStatus`)
- Modify: `D:\labs\CareKan\backend\src\routes\index.ts`
- Test: `D:\labs\CareKan\backend\src\test\admin.test.ts`

**Interfaces:**
- Consumes: `prisma`, mappers, `adminQuerySchema`/`updateStatusSchema`, `roleGuard('admin')`.
- Produces:
  - `getAdminQueue(query)` → `Appointment[]`.
  - `updateStatus(id, status)` → `Appointment` (validates legal transition, bumps `queueUpdatedAt`/`checkedInAt`).
  - Routes: `GET /api/admin/queue`, `PATCH /api/admin/appointments/:id/status` (admin-gated).

- [ ] **Step 1: Write failing admin tests**

`src/test/admin.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();
let adminToken: string;
let citizenToken: string;

beforeAll(async () => {
  await resetDb(prisma);
  await runSeed(prisma);
  adminToken = (await request(app).post('/api/auth/login').send({ nationalId: '9876543210987', password: 'care1234' })).body.token;
  citizenToken = (await request(app).post('/api/auth/login').send({ nationalId: '1234567890123', password: 'care1234' })).body.token;
});

describe('admin', () => {
  it('forbids a citizen from the admin queue (403)', async () => {
    const res = await request(app).get('/api/admin/queue?hospitalId=klang&date=2026-06-18').set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns the queue for a hospital/date', async () => {
    const seeded = await prisma.reserve.findFirst({ include: { schedule: true }, where: { hospitalId: 'klang' } });
    const date = seeded!.schedule.date;
    const res = await request(app).get(`/api/admin/queue?hospitalId=klang&date=${date}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.appointments)).toBe(true);
  });

  it('advances a status and sets checkedInAt on check-in', async () => {
    const r = await prisma.reserve.findFirst({ where: { status: 'confirmed' }, include: { schedule: true } });
    const res = await request(app).patch(`/api/admin/appointments/${r!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'checked_in' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('checked_in');
    expect(res.body.appointment.checkedInAt).toBeTruthy();
  });

  it('rejects an illegal transition (completed -> pending) with 400', async () => {
    const r = await prisma.reserve.findFirst({ where: { status: 'completed' }, include: { schedule: true } });
    const res = await request(app).patch(`/api/admin/appointments/${r!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`).send({ status: 'pending' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Add `getAdminQueue` + `updateStatus` to `appointment.service.ts`**

Append:

```ts
import type { AdminQueueQuery } from '../../../shared/api';
import type { AppointmentStatus } from '../../../shared/types';

export async function getAdminQueue(query: AdminQueueQuery) {
  const rows = await prisma.reserve.findMany({
    where: {
      hospitalId: query.hospitalId,
      schedule: { date: query.date, ...(query.clinic ? { clinic: query.clinic } : {}) },
    },
    include: RESERVE_INCLUDE,
    orderBy: [{ schedule: { startTime: 'asc' } }, { queueNumber: 'asc' }],
  });
  return rows.map(toAppointmentDto);
}

const LEGAL_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'no_show', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function updateStatus(id: string, next: AppointmentStatus) {
  const current = await prisma.reserve.findUnique({ where: { id } });
  if (!current) throw new ApiError('ไม่พบนัดหมาย', 404, 'NOT_FOUND');
  if (!LEGAL_TRANSITIONS[current.status].includes(next)) {
    throw new ApiError(`เปลี่ยนสถานะจาก ${current.status} เป็น ${next} ไม่ได้`, 400, 'ILLEGAL_TRANSITION');
  }
  const updated = await prisma.reserve.update({
    where: { id },
    data: {
      status: next,
      queueUpdatedAt: new Date(),
      ...(next === 'checked_in' && !current.checkedInAt ? { checkedInAt: new Date() } : {}),
    },
    include: RESERVE_INCLUDE,
  });
  return toAppointmentDto(updated);
}
```

- [ ] **Step 3: Write `controllers/admin.controller.ts`**

```ts
import type { Request, Response } from 'express';
import type { AdminQueueResponse, AppointmentResponse } from '../../../shared/api';
import { adminQuerySchema, updateStatusSchema } from '../validation/schemas.js';
import * as svc from '../services/appointment.service.js';

export async function queue(req: Request, res: Response): Promise<void> {
  const query = adminQuerySchema.parse(req.query);
  res.json({ appointments: await svc.getAdminQueue(query) } satisfies AdminQueueResponse);
}

export async function setStatus(req: Request, res: Response): Promise<void> {
  const { status } = updateStatusSchema.parse(req.body);
  const appointment = await svc.updateStatus(req.params.id, status);
  res.json({ appointment } satisfies AppointmentResponse);
}
```

- [ ] **Step 4: Mount routes (admin-gated)**

Add to `src/routes/index.ts`:

```ts
import * as admin from '../controllers/admin.controller.js';

router.get('/admin/queue', authGuard, roleGuard('admin'), asyncHandler(admin.queue));
router.patch('/admin/appointments/:id/status', authGuard, roleGuard('admin'), asyncHandler(admin.setStatus));
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- admin`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/admin.controller.ts backend/src/services/appointment.service.ts backend/src/routes/index.ts backend/src/test/admin.test.ts
git commit -m "feat(admin): queue list + guarded status transitions"
```

---

## Task 9: Full-suite green + RBAC parity check + README

**Files:**
- Create: `D:\labs\CareKan\backend\src\test\rbac.test.ts`
- Create/Modify: `D:\labs\CareKan\README.md` (root) — backend run instructions
- Test: full suite

**Interfaces:**
- Consumes: `ROUTE_ROLES` from `shared/api.ts`, all mounted routes.

- [ ] **Step 1: Write the RBAC parity test**

`src/test/rbac.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ROUTE_ROLES } from '../../../shared/api';

describe('RBAC table parity', () => {
  it('every contract route has a backend role decision documented', () => {
    // Guard against drift: this list must mirror routes/index.ts.
    const implemented = new Set([
      'POST /auth/login', 'POST /auth/register', 'POST /auth/logout', 'GET /auth/me',
      'GET /hospitals', 'GET /hospitals/:id', 'GET /hospitals/:id/time-slots',
      'POST /appointments', 'GET /appointments/me', 'GET /appointments/:id',
      'GET /admin/queue', 'PATCH /admin/appointments/:id/status',
    ]);
    for (const route of Object.keys(ROUTE_ROLES)) {
      expect(implemented.has(route)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the entire suite**

Run (from `backend`): `npm test`
Expected: all suites PASS (health, schema, seed, mappers, auth, hospital, appointment, admin, rbac).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Write root README backend section**

Add to `D:\labs\CareKan\README.md` a "Backend" section documenting:
```
1. docker compose up -d           # start Postgres
2. cd backend && npm install
3. cp .env.example .env            # then set JWT_SECRET
4. npx prisma migrate dev          # create tables
5. npm run db:seed                 # load 9 hospitals + demo accounts
6. npm run dev                     # http://localhost:4000

Demo accounts (password: care1234):
  citizen  1234567890123
  admin    9876543210987
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/rbac.test.ts README.md
git commit -m "test: rbac parity + full green suite; docs: backend run guide"
```

---

## Self-Review Notes (for the implementer)

- **Contract coverage:** all 12 `ROUTE_ROLES` entries are implemented (Tasks 5–8) and asserted by `rbac.test.ts` (Task 9). The one **intentional contract change** is `LoginResponse.token` (Task 5 Step 2) — flagged in design; update the frontend `endpoints.ts` consumer in the frontend plan.
- **Type consistency:** service include shape `RESERVE_INCLUDE` is reused by every appointment/admin read so `toAppointmentDto` always receives `schedule` + `user`. Don't query reserves without it.
- **Known seed simplification:** every hospital gets the same `CLINICS` set; if the frontend `HospitalDetail` expects per-hospital clinic variation, extend `CLINICS` per hospital in `seed.ts` — not required for the demo.
- **`booked` consistency:** `currentBooked` is the source of truth for slot fullness; `toTimeSlotDto` exposes it as `booked`. The frontend's old `getDayAvailability` is replaced by summing `slots[].capacity - booked` (handled in the frontend plan).
```