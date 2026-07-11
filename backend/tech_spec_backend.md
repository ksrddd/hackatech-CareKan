# CareKan Backend — Technical Specification

| | |
|---|---|
| **Service** | `carekan-backend` |
| **Runtime** | NestJS 10 (Express platform) · Node.js 20 · TypeScript (CommonJS) |
| **Data** | Prisma 5 · Supabase Postgres |
| **Branch** | `backend-nest` |
| **Version** | 1.0.0 |
| **Status** | Phase 1 delivered (deploy pending) · Phase 2 specified |
| **Last updated** | 2026-07-11 |

---

## 1. Overview

CareKan backend คือ REST API สำหรับระบบจองคิวโรงพยาบาลรัฐในกรุงเทพมหานคร ให้บริการแก่ 3 กลุ่มผู้ใช้:

1. **Citizen** — ประชาชนที่ล็อกอินด้วยเลขบัตรประชาชน (JWT) เพื่อค้นหาโรงพยาบาล จองคิว และดูใบนัด/QR
2. **Hospital systems** — ระบบของโรงพยาบาลที่เรียก API แบบ server-to-server ด้วย API key เพื่อสร้าง/อัปเดตการจอง
3. **LINE Official Account** — webhook สำหรับตอบข้อความและส่ง Flex Message

เอกสารนี้กำหนดสถาปัตยกรรม, API contract, data model, security, และกระบวนการ deploy ของระบบปัจจุบัน (Phase 1) รวมถึงข้อกำหนดของงานฟีเจอร์ในอนาคต (Phase 2)

### 1.1 Scope

| Phase | ขอบเขต | สถานะ |
|-------|--------|-------|
| **Phase 1** | ย้าย runtime จาก Express เป็น NestJS และย้าย database ไป Supabase โดยคง API contract เดิมทุกประการ | Delivered — เหลือ production deployment |
| **Phase 2** | เพิ่มฟีเจอร์ตลอด patient journey (ก่อน/ระหว่าง/หลังการรักษา) แบบ additive | Specified — §11 |

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Component | หมายเหตุ |
|-------|-----------|----------|
| HTTP framework | NestJS 10 บน `@nestjs/platform-express` | DI container + module system |
| ORM | Prisma 5 | schema-first, migrations versioned |
| Database | Supabase Postgres | เข้าถึงผ่าน connection pooler (§9.1) |
| Validation | Zod ผ่าน custom `ZodValidationPipe` | schema อยู่ใน `src/validation/schemas.ts` |
| Auth (citizen) | `jsonwebtoken` (HS256, อายุ 7 วัน) | ออก/ตรวจ token เอง |
| Auth (hospital) | API key (SHA-256 hash) ผ่าน header `x-api-key` | |
| Messaging | `@line/bot-sdk` | webhook + Messaging API |
| Test | Vitest + Supertest + `unplugin-swc` | e2e ยิง HTTP จริง |
| Module system | CommonJS (`module: Node16`) | required for decorator metadata |

### 2.2 Module Layout

ระบบจัดโครงเป็น NestJS module หนึ่งโดเมนต่อหนึ่งโฟลเดอร์ business logic อยู่ใน `*.service.ts` (`@Injectable`), HTTP binding อยู่ใน `*.controller.ts`

```
src/
├─ main.ts                    # bootstrap (NestFactory + configureApp)
├─ configure-app.ts           # การตั้งค่า app ที่ main.ts และ test ใช้ร่วมกัน
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

Dependency: `PrismaModule` เป็น `@Global`; `AuthModule` export `AuthService` ให้ module ที่ใช้ `JwtAuthGuard` (appointments, api-keys)

### 2.3 Request Pipeline

```
Request
  → Guard (JwtAuthGuard | HospitalKeyGuard | LineSignatureGuard)   [ถ้ามี]
  → ZodValidationPipe (parse body/query)
  → Controller
  → Service (business logic, Prisma)
  → Mapper (row → DTO)
  → Response
Exception ทุกชนิด → AllExceptionsFilter → error envelope (§4.4)
```

### 2.4 Application Bootstrap

`configureApp(app)` เป็นจุดกำหนดค่ากลางที่ทั้ง `main.ts` และ test bootstrap เรียกใช้ เพื่อรับประกันว่า runtime กับ test environment เหมือนกันทุกประการ:

| การตั้งค่า | ค่า | เหตุผล |
|-----------|-----|--------|
| `rawBody` | `true` | LINE webhook ต้องใช้ raw body ตรวจ HMAC signature |
| CORS | `origin: true, credentials: true` | คงพฤติกรรมเดิมจาก Express |
| Global prefix | `api` ยกเว้น `line/webhook` | LINE webhook อยู่นอก `/api` |
| Global filter | `AllExceptionsFilter` | error envelope เดียวทั้งระบบ |
| Shutdown hooks | เปิด | ปิด Prisma connection อย่าง graceful |

---

## 3. API Contract

### 3.1 Conventions

- **Base path:** `/api` (ยกเว้น `POST /line/webhook`)
- **Content type:** `application/json`
- **Authentication schemes:**
  - `JWT` — header `Authorization: Bearer <token>`
  - `x-api-key` — header `x-api-key: <key>` (หรือ `Authorization: ApiKey <key>`)
  - `LINE signature` — header `x-line-signature` (HMAC-SHA256)
- **Status codes:** ยึดตามตาราง §3.2 — status ที่ไม่ตรงกับ NestJS default ถูกกำหนดด้วย `@HttpCode`

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

> `GET /api/appointments/:id` คืน `404` ทั้งกรณีไม่พบและกรณีไม่ใช่เจ้าของ (ไม่รั่ว existence)
> route `me` ถูกประกาศก่อน `:id` เพื่อไม่ให้ path ชนกัน

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

Request/response type ทั้งหมดนิยามใน `shared/api.ts` และ `shared/types.ts` ซึ่ง frontend และ backend import ร่วมกัน การเปลี่ยน DTO จึงเปลี่ยน contract ของทั้งสองฝั่งพร้อมกัน `src/mappers/mappers.ts` เป็นชั้นเดียวที่แปลง Prisma row เป็น DTO

### 3.4 Error Model

ทุก error response มีรูปแบบเดียว (`ApiErrorBody`):

```json
{ "error": "<ข้อความภาษาไทย>", "code": "<OPTIONAL_CODE>", "details": { "<field>": "<message>" } }
```

| แหล่ง | HTTP status | รูปแบบ |
|-------|-------------|--------|
| `ApiError` (business error) | ตามที่กำหนด | `{ error, code?, details? }` |
| `ZodError` (validation) | 400 | `{ error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION", details }` |
| อื่น ๆ (unhandled) | 500 | `{ error: "เกิดข้อผิดพลาดภายในระบบ" }` |

ข้อความ `error` เป็นภาษาไทยและถูกแสดงต่อผู้ใช้โดยตรงที่ frontend

---

## 4. Data Model

Schema กำหนดใน `prisma/schema.prisma` (Postgres) ประกอบด้วย 5 ตารางและ 6 enum

| Model | Table | บทบาท | Key constraints |
|-------|-------|-------|-----------------|
| `User` | `users` | บัญชีประชาชน | `nationalId` unique, `email` unique |
| `Hospital` | `hospitals` | โรงพยาบาล | `services[]`, `rightsAccepted[]` เป็น enum array; จัดกลุ่มด้วย `zone` |
| `Schedule` | `schedules` | ช่วงเวลาแบบ weekly template (ใช้ร่วมทุก รพ.) | unique `(dayOfWeek, startTime)` |
| `Reserve` | `reserves` | การจอง | `bookingCode` unique; index `(hospitalId, scheduleId, date)` |
| `HospitalApiKey` | `hospital_api_keys` | API key ของโรงพยาบาล | `hash` unique; รองรับ revoke |

**Enums:** `InsuranceRight`, `Sex`, `ServiceType`, `Zone`, `AppointmentStatus` (`pending`/`confirmed`/`checked_in`/`in_progress`/`completed`/`cancelled`/`no_show`)

**ข้อสังเกตเชิงออกแบบ:**
- `Schedule` ไม่มี foreign key ไป `Hospital` — เป็น template กลางที่ทุกโรงพยาบาลใช้ตารางเวลาเดียวกัน (ดู §12 ข้อ 3)
- `Reserve.queueNumber` คำนวณจากจำนวนที่จองแล้ว + 1 ณ เวลาสร้าง

---

## 5. Security & Privacy

### 5.1 Citizen Authentication
- Password hash ด้วย bcrypt (cost 10)
- JWT payload `{ sub: userId }` ลงนามด้วย `JWT_SECRET` (HS256) อายุ 7 วัน
- `registerSchema` ตรวจ checksum เลขบัตรประชาชนจริง (`isThaiNationalId`)

### 5.2 Hospital API Keys
- Key รูปแบบ `ck_live_<random>` เก็บใน DB เป็น **SHA-256 hash** เท่านั้น (plaintext ไม่เคยถูกเก็บ)
- ตรวจสอบผ่าน `HospitalKeyGuard`; รองรับ `revokedAt` และบันทึก `lastUsedAt` แบบ fire-and-forget
- แต่ละ key ผูกกับ `hospitalId` เดียว — สร้าง/แก้การจองข้ามโรงพยาบาลถูกปฏิเสธด้วย `403 HOSPITAL_MISMATCH`

### 5.3 LINE Webhook
- ตรวจ `x-line-signature` (HMAC-SHA256 บน raw body) ใน `LineSignatureGuard` ก่อนประมวลผลทุกครั้ง

### 5.4 Row Level Security (Supabase)
Phase 1 เข้าถึง Postgres ผ่าน Prisma ด้วย `postgres` role ซึ่ง bypass RLS ทั้งหมด **ตารางทั้งหมดจึงยังไม่มี RLS policy** ข้อจำกัดที่ต้องบังคับใช้: ห้ามเปิด PostgREST/anon access ให้ตารางเหล่านี้จนกว่าจะเขียน policy (เป็น prerequisite ของ Phase 2 §11.6)

---

## 6. Configuration

Environment variables โหลดผ่าน `@nestjs/config` และ validate ด้วย Zod (`config/env.ts`) — process จะ terminate ทันทีตอน boot ถ้าตัวแปร required ขาด

| Variable | Required | Default | หมายเหตุ |
|----------|:--------:|---------|----------|
| `DATABASE_URL` | ✅ | — | Supabase transaction pooler (6543, `?pgbouncer=true`) |
| `DIRECT_URL` | ✅ (migrate) | — | Supabase session pooler (5432); อ่านโดย Prisma CLI |
| `JWT_SECRET` | ✅ | — | HS256 signing key |
| `PORT` | — | `4000` | |
| `LINE_CHANNEL_SECRET` | — | `""` | ปิด webhook ถ้าเว้นว่าง |
| `LINE_CHANNEL_TOKEN` | — | `""` | Messaging API |
| `LIFF_ID` | — | `""` | |
| `GOOGLE_APPS_SCRIPT_URL` | — | `""` | ปิด sheet logging ถ้าเว้นว่าง |

---

## 7. Testing

- **กลยุทธ์:** e2e test (Supertest) ยิง HTTP จริงผ่าน Nest app ที่ประกอบด้วย `configureApp` เดียวกับ production — assertion ทำหน้าที่เป็น contract test
- **Database:** ชี้ local Postgres (`carekan_test`) เสมอ; `src/test/setup.ts` throw ถ้า `DATABASE_URL` ไม่ใช่ localhost เพราะ suite เรียก `resetDb()` ที่ล้างทุกตาราง
- **Isolation:** `fileParallelism: false` (ทุกไฟล์ใช้ test DB ร่วมกัน)
- **Coverage:** auth, hospitals, appointments, hospital-api, api-key schema, mappers, seed, health, LINE signature — รวม 38 test
- **Decorator metadata:** Vitest ใช้ `unplugin-swc` เป็น transformer แทน esbuild (esbuild ไม่ emit `emitDecoratorMetadata` ที่ Nest DI ต้องใช้)

---

## 8. Build & Run

```
npm run dev        # tsc-watch → node dist/backend/src/main.js
npm run build      # tsc -p tsconfig.json
npm start          # node dist/backend/src/main.js
npm run typecheck  # tsc --noEmit
npm test           # vitest run (ต้องมี local Postgres)
```

Compiler config หลัก: `module: Node16`, `experimentalDecorators`, `emitDecoratorMetadata`, `rootDir: ".."` (เพื่อ import `shared/` ที่อยู่นอก `backend/`) → build output อยู่ที่ `dist/backend/src/`

---

## 9. Deployment

### 9.1 Supabase (Database)

Prisma ต้องใช้ connection สองแบบ:

| ตัวแปร | Port | ใช้ตอน | เหตุผล |
|--------|------|--------|--------|
| `DATABASE_URL` | 6543 (transaction pooler) | runtime query | ประหยัด connection ผ่าน PgBouncer |
| `DIRECT_URL` | 5432 (session pooler) | `prisma migrate` | migration ต้องใช้ session-level features ที่ transaction pooler ไม่รองรับ |

`schema.prisma` ประกาศทั้งสองผ่าน `url` และ `directUrl`

### 9.2 Application (Railway / Render)

| รายการ | ค่า |
|--------|-----|
| Build command | `npm run build` |
| Start command | `node dist/backend/src/main.js` |
| Release command | `prisma migrate deploy` |
| Health check | `GET /api/health` |
| Deployment model | long-lived Node process (ไม่ใช่ serverless) |

Post-deploy: อัปเดต LINE webhook URL → domain ใหม่, ชี้ frontend (`VITE_API_BASE_URL`) → backend ใหม่ โดยไม่แก้โค้ด frontend

### 9.3 Deployment Status
Application deployment ยังไม่ดำเนินการ Database (Supabase) migrate + seed แล้ว

---

## 10. Phase 1 — Migration Record

### 10.1 Outcome
ย้าย Express → NestJS และ Docker/Vercel Postgres → Supabase โดย API contract (§3) ไม่เปลี่ยน ยืนยันด้วย:
- Test suite 38/38 ผ่าน
- Contract regression 20/20 — เทียบ status + body ระหว่าง Express เดิมและ NestJS ใหม่ตรงกันทุกเคส
- End-to-end flow ผ่าน frontend เดิม (ไม่แก้โค้ด): register → login → search → book → QR

### 10.2 Design Decisions

| # | การตัดสินใจ | เหตุผล |
|---|-------------|--------|
| D1 | คง Prisma (ไม่ใช้ supabase-js) | Supabase เป็น Postgres มาตรฐาน; schema + migrations เดิมใช้ต่อได้ทันที |
| D2 | คง JWT ที่ออกเอง (ไม่ใช้ Supabase Auth) | Supabase Auth ผูกกับ email/phone ไม่รองรับ login ด้วยเลขบัตร 13 หลัก และจะบังคับให้แก้ frontend |
| D3 | `module: Node16` (CJS) ไม่ใช่ suffix-stripping | คง `.js` import suffix เดิมได้ทั้งหมด ลดพื้นที่การเปลี่ยนแปลง |
| D4 | คง Vitest + `unplugin-swc` (ไม่ port ไป Jest) | assertion เดิมไม่ต้องแก้ → contract fidelity สูงกว่า |
| D5 | `jsonwebtoken` ตรง ไม่ใช้ `@nestjs/jwt` | logic ~15 บรรทัด ไม่คุ้มการเพิ่ม dependency |
| D6 | Zod pipe ไม่ใช่ `class-validator` | error `details` shape ต้องคงเดิมเพื่อ frontend |
| D7 | Railway/Render ไม่ใช่ Vercel serverless | long-lived process เหมาะกับ Prisma connection pool และ LINE raw-body |

### 10.3 Incidental Fixes
- `rootDir` เดิมชี้เกิน repo root หนึ่งชั้น (`../..`) ทำให้ `npm start` เดิมพัง — แก้เป็น `..`
- `health.test.ts` มี assertion ที่ล้าสมัย (ไม่ตรงกับ response body จริง) — แก้ให้ตรง

---

## 11. Phase 2 — Feature Specification

เพิ่มฟีเจอร์ตลอด patient journey แบบ **additive** — endpoint และ contract จาก §3 ไม่เปลี่ยน ฟีเจอร์ใหม่เป็น module/ตาราง/endpoint ที่เพิ่มเข้ามา

### 11.1 Feature Inventory

| # | Feature | Phase | Module | Foundation |
|---|---------|-------|--------|:----------:|
| 1 | ผู้ดูแลจองคิวแทน | Before | `caregivers` | A |
| 2 | แนะนำช่วงเวลาที่ผู้ป่วยน้อย | Before | `hospitals` | — |
| 3 | แจ้งเตือนวัน-เวลานัด | Before | `notifications` | N |
| 4 | ตรวจสอบสิทธิการรักษา | Before | `entitlement` | — |
| 5 | รายการเอกสารก่อนเข้ารับบริการ | Before | `appointments` | — |
| 6 | แจ้งเตือนเมื่อเช็กอิน | During | `queue` | N |
| 7 | สถานะคิวแบบ real-time | During | `queue` | R |
| 8 | แจ้งเมื่อคิวล่าช้า | During | `queue` + `notifications` | R, N |
| 9 | ประกาศเหตุฉุกเฉิน/ความล่าช้า | During | `announcements` | — |
| 10 | แจ้งผู้ดูแลเมื่อผู้ป่วยมาถึง | During | `caregivers` + `notifications` | A, N |
| 11 | แปลผลการรักษาเป็นภาษาเข้าใจง่าย (LLM) | After | `records` | S |
| 12 | เตือนรับประทานยา | After | `records` + `notifications` | N |
| 13 | เตือนนัดครั้งถัดไป | After | `appointments` + `notifications` | N |
| 14 | แชร์ผลการรักษาให้ครอบครัว (consent) | After | `records` + `caregivers` | A, S |
| 15 | คลังเอกสาร (ใบนัด/ใบเสร็จ/ผล) | After | `documents` | S |

**Foundations:** A = Caregiver/Managed patient · N = Notification service · R = Real-time queue · S = Storage & records

### 11.2 Foundation A — Managed Patient

รองรับผู้ป่วย (เช่น ผู้สูงอายุ) ที่ไม่มีบัญชีของตนเอง ให้ผู้ดูแลจองแทน

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

- `Reserve` เพิ่มคอลัมน์ nullable `managedPatientId` (null = จองให้ตนเอง → พฤติกรรมเดิมไม่เปลี่ยน)
- Endpoints: `GET|POST|DELETE /api/dependents`; `POST /api/appointments` รับ `dependentId?`

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

- **Channel:** LINE Messaging API (`pushMessage`) — reuse client ใน `line/`; ผูก `lineUserId` ตอน login ผ่าน LIFF
- **Scheduler:** `@nestjs/schedule` (`@Cron`) สแกน `Reserve` ที่ใกล้ถึงกำหนด
- **Idempotency:** ตรวจ `NotificationLog` ก่อนส่ง

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

- โรงพยาบาลอัปเดตเลขคิวปัจจุบันผ่าน `PATCH /api/hospital/queue` (`x-api-key`)
- **Client subscribe ผ่าน Supabase Realtime** บนตาราง `queue_states` (ต้องเปิด Realtime + RLS read-only)
- MVP fallback: `GET /api/hospitals/:id/queue?date=` แบบ polling

### 11.5 Foundation S — Records & Documents

```prisma
model MedicalRecord {
  id           String   @id @default(cuid())
  reserveId    String   @unique @map("reserve_id")
  summaryRaw   String   @map("summary_raw")
  summaryPlain String?  @map("summary_plain")   // ผลผลิต LLM; cache
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

- ไฟล์เก็บใน Supabase Storage (private bucket); backend คืน signed URL อายุสั้น
- LLM (feature 11): `POST /api/records/:id/explain` เรียก Claude (`claude-haiku-4-5` สำหรับต้นทุน/ความเร็ว) แปลงศัพท์แพทย์ → เก็บ `summaryPlain` (เรียกครั้งเดียวต่อ record)

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

ทุก endpoint ที่คืนข้อมูลผู้ป่วยต้องตรวจ ownership (เจ้าของ หรือ guardian ที่มี consent) ตาม pattern `getAppointmentForOwner` เดิม

### 11.7 Schema Changes Summary
- **ตารางใหม่:** `managed_patients`, `notification_prefs`, `notification_logs`, `queue_states`, `medical_records`, `documents`, `announcements`
- **แก้ตารางเดิม (nullable, additive):** `reserves.managed_patient_id`
- Migration รันผ่าน `DIRECT_URL` (§9.1)

### 11.8 Sequencing

| Round | งาน | เหตุผล |
|-------|-----|--------|
| 0 | เคลียร์ §12 ข้อ 1 (booking race) และ ข้อ 5 (`/scanned/:id`) | prerequisite ของคิว real-time และความเป็นส่วนตัว |
| 1 | Feature 6 (check-in), 9 (announcements), 2 (suggest-slots) | ฐานข้อมูลมีเกือบครบ ส่งมอบเร็ว |
| 2 | Foundation N, R | ปลดล็อกฟีเจอร์แจ้งเตือนและคิวจำนวนมาก |
| 3 | Foundation A, S; feature 11, 12, 14 | ต้องการ model และ integration ใหม่ |

### 11.9 Risks

| ความเสี่ยง | ผลกระทบ | การจัดการ |
|-----------|---------|-----------|
| เปิด Realtime/Storage โดยไม่มี RLS | anon key อ่านข้อมูลผู้ป่วยได้ทั้งตาราง | เขียน RLS policy เป็น prerequisite (§5.4) |
| โควตา LINE push (บัญชีฟรี) | แจ้งเตือนส่งไม่ครบ | คุมจำนวน + fallback in-app notification |
| ต้นทุน/latency LLM (feature 11) | ค่าใช้จ่ายและเวลาตอบสูง | cache `summaryPlain`, ใช้ `claude-haiku-4-5` |
| PDPA — ข้อมูลผลการรักษาอ่อนไหว (feature 14) | ความเสี่ยงด้านกฎหมาย | บังคับ consent + audit log การเข้าถึง |
| เช็คสิทธิจริง (feature 4) ต้องต่อ API สปสช. | dependency ภายนอก | MVP ให้ผู้ใช้กรอกเอง เทียบกับ `Hospital.rightsAccepted` |

---

## 12. Known Issues / Technical Debt

รายการที่มีอยู่ก่อน Phase 2 ควรจัดการตามลำดับความสำคัญ:

1. **Booking race condition** — `createAppointment`/`createReserve` ใช้ `count()` เทียบ `maxCapacity` ภายใต้ isolation `READ COMMITTED` (default) จองพร้อมกันอาจเกิน capacity ได้ → แก้ด้วย unique constraint หรือ `Serializable` **(สำคัญสุด — correctness)**
2. **`/api/scanned/:id` เป็น public** — ใครทราบ `id` (cuid) อ่านชื่อผู้ป่วยได้ → ใช้ signed token ใน QR **(privacy)**
3. **`Schedule` ไม่ผูกกับ `Hospital`** — ตารางเวลาเป็น template กลาง หากต้องการเวลาเปิดต่างกันต่อ รพ. ต้อง migrate schema
4. **`queueNumber` = `booked + 1`** — เลขคิวซ้ำได้เมื่อมีการยกเลิก
5. **โค้ดจองซ้ำ** — logic การจอง (`generateBookingCode`, `RESERVE_INCLUDE`, capacity check) ซ้ำใน `appointments` และ `hospital-api` → ควรรวมเป็น service เดียว
6. **ไม่มี rate limiting** บน `/auth/login` และ `/hospital/*` → `@nestjs/throttler`
7. **ไม่มี structured logging / request id** → `nestjs-pino`
