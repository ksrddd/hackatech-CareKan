# CareKan Backend — Tech Spec (Upgrade Plan)

เอกสารนี้เป็นแผนการอัปเกรด backend ของ CareKan แบ่งเป็น 2 เฟส

| เฟส | เป้าหมาย | สถานะ |
|-----|----------|-------|
| **Phase 1** | ย้าย tech stack: Express → **NestJS**, Postgres (Docker/Railway) → **Supabase** โดย **endpoint และ response contract เหมือนเดิมทุกตัว** | 📋 เอกสารนี้ |
| **Phase 2** | เพิ่ม endpoint และฟีเจอร์ใหม่บนสถาปัตยกรรม NestJS | ⏳ รอกำหนด |

---

# Phase 1 — Migration to NestJS + Supabase

> **สถานะการทำจริง (2026-07-10)**: Stage 1–3 (NestJS migration) + Stage 0/4 (Supabase) **เสร็จแล้ว** บน branch `backend-nest`
> — เทสต์ 38/38 เขียว, contract regression 20/20 ตรงกับ Express เดิม, build + boot ผ่าน
> — Supabase: `directUrl` เพิ่มใน schema, migrate deploy + seed (45 รพ. / 70 slots) + booking smoke test ผ่านบน Supabase จริง
> **เหลืออย่างเดียว: deploy ขึ้น Railway/Render** (Stage 4 ข้อ 23–29)
> จุดที่ทำต่างจากแผน: §5.5 (Node16 แทน suffix-stripping), §7 (คง Vitest+SWC แทน Jest),
> dev script ใช้ `tsc-watch` แทน `@nestjs/cli` (ไม่ต้องมี nest-cli.json), auth ใช้ `jsonwebtoken` ตรงๆ (§1.3),
> `.env.test` คงชี้ Docker local + guard ใน `setup.ts` กัน resetDb() ยิงใส่ Supabase

## 1. เป้าหมายและขอบเขต

### 1.1 เป้าหมาย

ย้ายจาก Express + Prisma + Postgres(Docker) ไปเป็น **NestJS + Prisma + Supabase Postgres** โดยที่ **frontend ไม่ต้องแก้โค้ดแม้แต่บรรทัดเดียว**

เกณฑ์ความสำเร็จของเฟสนี้มีข้อเดียว:

> ชุดเทสต์เดิมทั้ง 8 ไฟล์ใน `src/test/` (ที่ยิงผ่าน Supertest) ต้องผ่านทั้งหมดโดยแทบไม่แก้ assertion และ frontend ที่ deploy อยู่ต้องชี้มาที่ backend ตัวใหม่แล้วทำงานได้ทันที

### 1.2 สิ่งที่ **จะ** เปลี่ยน

- HTTP framework: Express → NestJS (ยังใช้ Express เป็น underlying platform)
- โครงสร้างโค้ด: layered แบบ manual → NestJS module + DI container
- Database host: Postgres ใน Docker/Railway → Supabase Postgres
- Deployment: Vercel serverless → **Railway หรือ Render** (long-lived Node process)
- ~~Test runner: Vitest → Jest~~ → **คง Vitest ไว้** + `unplugin-swc` (สูตรจากเอกสาร NestJS) — esbuild ไม่ emit decorator metadata ที่ Nest DI ต้องใช้ จึงสลับ transformer เป็น SWC แทน ได้ผลคือเทสต์เดิมแก้แค่ bootstrap (`makeNestApp()` + `beforeAll`) ส่วน assertion ไม่แตะเลย = contract fidelity สูงกว่า port ไป Jest

### 1.3 สิ่งที่ **จะไม่** เปลี่ยน (ตัดสินใจแล้ว)

| หัวข้อ | คงเดิม | เหตุผล |
|--------|--------|--------|
| **ORM** | Prisma 5 | Supabase คือ Postgres ธรรมดา — `schema.prisma` และ migration ทั้ง 7 ไฟล์ใช้ต่อได้ทันที ไม่ต้อง port อะไรเลย |
| **Auth** | JWT ที่เราออกเอง (`jsonwebtoken` ตรงๆ ไม่ผ่าน `@nestjs/jwt`) | ไม่ใช้ Supabase Auth เพราะ GoTrue ผูกกับ email/phone ไม่รองรับ login ด้วยเลขบัตร 13 หลักโดยตรง และการย้ายจะบังคับให้แก้ frontend ด้วย — ผิดเป้าหมายเฟสนี้ ส่วน `@nestjs/jwt` ก็ตัดออก: logic เดิมมีแค่ ~15 บรรทัด ห่อ lib ตัวเดิมไว้เฉยๆ ไม่คุ้มความเสี่ยง |
| **Domain logic** | `services/*.ts` ทั้งหมด | ย้ายเข้า class + `@Injectable()` แต่ **ตัว body ของฟังก์ชันไม่แตะ** |
| **Validation** | Zod | ไม่ย้ายไป `class-validator` เพราะ `shared/` และ error shape ผูกกับ Zod อยู่ (ดู §5.3) |
| **Wire contract** | `shared/api.ts`, `shared/types.ts` | ไฟล์ในโฟลเดอร์ `shared/` **ห้ามแก้** ตลอดเฟสนี้ — ถือเป็น frozen contract |

### 1.4 Non-goals

- ❌ ไม่แตะ frontend
- ❌ ไม่เพิ่ม endpoint ใหม่ (ยกไปเฟส 2)
- ❌ ไม่ใช้ Supabase Auth / Storage / Realtime / RLS ในเฟสนี้ — ใช้ Supabase เป็น **managed Postgres** เท่านั้น
- ❌ ไม่แก้ business logic bug ที่มีอยู่ (เช่น race condition ใน capacity check — บันทึกไว้ที่ §9 แล้วยกไปเฟส 2)

---

## 2. Frozen Contract — Endpoint Inventory

ตารางนี้คือ **acceptance criteria** ของเฟส 1 ทุกช่องต้องเหมือนเดิม 100% ทั้ง path, method, status code, request shape, response shape, error code

### 2.1 Public / Health

| Method | Path | Auth | Success | Response |
|--------|------|------|---------|----------|
| GET | `/api/health` | — | 200 | `{ ok, service, version }` |

> ⚠️ path นี้อยู่นอก router หลัก และต้องไม่โดน global prefix ซ้อนเป็น `/api/api/health`

### 2.2 Auth

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/auth/register` | — | **201** `{ user, token }` | `409 DUPLICATE`, `400 VALIDATION` |
| POST | `/api/auth/login` | — | **200** `{ user, token }` | `401 BAD_CREDENTIALS` |
| POST | `/api/auth/logout` | — | **204** (empty body) | — |
| GET | `/api/auth/me` | JWT | 200 `{ user }` | `401 UNAUTHENTICATED`, `401 INVALID_TOKEN`, `404 NOT_FOUND` |

### 2.3 Hospitals

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| GET | `/api/hospitals?q&district&zone&service&right` | — | 200 `{ hospitals }` | `400 VALIDATION` |
| GET | `/api/hospitals/:id` | — | 200 `{ hospital }` | `404 NOT_FOUND` |
| GET | `/api/hospitals/:id/time-slots?date=YYYY-MM-DD` | — | 200 `{ slots }` | `400 VALIDATION` |

### 2.4 Appointments

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/appointments` | JWT | **201** `{ appointment }` | `404 SLOT_NOT_FOUND`, `400 DATE_MISMATCH`, `409 SLOT_FULL`, `500 REF_COLLISION` |
| GET | `/api/appointments/me` | JWT | 200 `{ upcoming, history }` | `401` |
| GET | `/api/appointments/:id` | JWT | 200 `{ appointment }` | `404 NOT_FOUND` (รวมกรณีไม่ใช่เจ้าของ) |
| GET | `/api/scanned/:id` | — | 200 `{ appointment }` | `404 NOT_FOUND` |

### 2.5 API Key Request

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/api/api-keys/requests` | JWT | **201** `{ submitted: true }` |

### 2.6 Hospital API (server-to-server)

| Method | Path | Auth | Success | Error codes |
|--------|------|------|---------|-------------|
| POST | `/api/hospital/reserves` | `x-api-key` | **201** `{ appointment }` | `401 MISSING_API_KEY`, `401 INVALID_API_KEY`, `401 KEY_REVOKED`, `403 HOSPITAL_MISMATCH`, `404 PATIENT_NOT_FOUND`, `404 SLOT_NOT_FOUND`, `409 SLOT_FULL` |
| PATCH | `/api/hospital/reserves/:id/status` | `x-api-key` | 200 `{ appointment }` | `404 RESERVE_NOT_FOUND`, `403 HOSPITAL_MISMATCH` |

### 2.7 LINE

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/line/webhook` | LINE signature | 200 (`sendStatus(200)`) |

> ⚠️ path นี้อยู่นอก `/api` prefix และ **ต้องได้ raw body** ไม่ใช่ parsed JSON

### 2.8 Error envelope (ห้ามเปลี่ยน)

ทุก error ต้องออกมาในรูปนี้เสมอ (`ApiErrorBody` ใน `shared/api.ts`) และข้อความ error เป็น**ภาษาไทย**เหมือนเดิมทุกตัวอักษร เพราะ frontend เอาไปแสดงตรงๆ

```
{ "error": "ข้อความภาษาไทย", "code": "OPTIONAL_CODE", "details": { "field": "msg" } }
```

- `ApiError` → `{ error, code?, details? }` ด้วย status ที่กำหนด
- `ZodError` → `400` + `{ error: 'ข้อมูลไม่ถูกต้อง', code: 'VALIDATION', details: { <path>: <message> } }`
- อื่นๆ → `500` + `{ error: 'เกิดข้อผิดพลาดภายในระบบ' }`

---

## 3. สถาปัตยกรรมเป้าหมาย (NestJS)

### 3.1 โครงสร้างโฟลเดอร์

```
backend/
├─ src/
│  ├─ main.ts                      # bootstrap: rawBody, CORS, global prefix, filters
│  ├─ app.module.ts                # root module
│  │
│  ├─ common/
│  │  ├─ errors/
│  │  │  ├─ api-error.ts           # ← ย้ายจาก src/errors.ts (ตัด asyncHandler ทิ้ง)
│  │  │  └─ all-exceptions.filter.ts   # ← ย้ายจาก middleware/errorHandler.ts
│  │  ├─ pipes/
│  │  │  └─ zod-validation.pipe.ts # แปลง Zod schema → Nest pipe
│  │  └─ guards/
│  │     ├─ jwt-auth.guard.ts      # ← ย้ายจาก middleware/auth.ts
│  │     └─ hospital-key.guard.ts  # ← ย้ายจาก middleware/hospitalKeyAuth.ts
│  │
│  ├─ config/
│  │  └─ config.module.ts          # @nestjs/config + Zod validate env
│  │
│  ├─ prisma/
│  │  ├─ prisma.module.ts          # @Global()
│  │  └─ prisma.service.ts         # extends PrismaClient, OnModuleInit/OnModuleDestroy
│  │
│  ├─ auth/
│  │  ├─ auth.module.ts
│  │  ├─ auth.controller.ts        # register / login / logout / me
│  │  └─ auth.service.ts           # signToken / hash / verify + register/login logic
│  │
│  ├─ hospitals/
│  │  ├─ hospitals.module.ts
│  │  ├─ hospitals.controller.ts   # list / detail / time-slots
│  │  └─ hospitals.service.ts
│  │
│  ├─ appointments/
│  │  ├─ appointments.module.ts
│  │  ├─ appointments.controller.ts  # create / mine / detail / scanned
│  │  └─ appointments.service.ts
│  │
│  ├─ hospital-api/                # server-to-server (API key)
│  │  ├─ hospital-api.module.ts
│  │  ├─ hospital-reserve.controller.ts
│  │  ├─ hospital-key.service.ts
│  │  └─ hospital-reserve.service.ts  # ← ย้าย logic ออกจาก controller เดิม
│  │
│  ├─ api-keys/
│  │  ├─ api-keys.module.ts
│  │  ├─ api-keys.controller.ts
│  │  └─ sheets.service.ts
│  │
│  ├─ line/
│  │  ├─ line.module.ts
│  │  ├─ line.controller.ts        # POST /line/webhook
│  │  ├─ line-signature.guard.ts   # ตรวจ x-line-signature จาก raw body
│  │  └─ flex-messages.ts          # ← ย้าย Flex builder ทั้ง 5 ตัวมาไว้ที่นี่
│  │
│  ├─ mappers/
│  │  └─ mappers.ts                # ← ย้ายมาตรงๆ (pure function, ไม่ต้อง DI)
│  │
│  └─ validation/
│     └─ schemas.ts                # ← ย้ายมาตรงๆ ไม่แก้
│
├─ prisma/                         # ← ไม่แตะ (schema + migrations + seed)
├─ data/                           # ← ไม่แตะ
├─ scripts/                        # key:gen / key:revoke — ปรับ import path เท่านั้น
└─ test/
   └─ e2e/                         # ← port จาก src/test/*.test.ts
```

### 3.2 Module dependency graph

```
                 AppModule
                     │
   ┌────────┬────────┼─────────┬──────────┬─────────┐
   │        │        │         │          │         │
ConfigModule │  AuthModule  HospitalsModule  │   LineModule
        PrismaModule    │            AppointmentsModule
         (@Global)      │                    │
                        └──── HospitalApiModule ──── ApiKeysModule
```

- `PrismaModule` เป็น `@Global()` → ทุก service inject `PrismaService` ได้โดยไม่ต้อง import ซ้ำ
- `AuthModule` export `AuthService` เพราะ `JwtAuthGuard` ต้องใช้ `verifyToken`

### 3.3 ตารางแปลง Express → NestJS

| Express (ปัจจุบัน) | NestJS (เป้าหมาย) | หมายเหตุ |
|---|---|---|
| `buildApp()` ใน `app.ts` | `AppModule` + `main.ts` | |
| `router.get(...)` ใน `routes/index.ts` | `@Get()` decorator บน controller | routing กระจายไปตาม module |
| `controllers/*.controller.ts` (fn) | `@Controller()` class | signature เปลี่ยนจาก `(req,res)` → return value |
| `services/*.service.ts` (fn) | `@Injectable()` class | **ตัว logic ไม่แก้** ห่อเป็น method |
| `middleware/auth.ts` | `JwtAuthGuard implements CanActivate` | |
| `middleware/hospitalKeyAuth.ts` | `HospitalKeyGuard implements CanActivate` | |
| `middleware/errorHandler.ts` | `@Catch() AllExceptionsFilter` | |
| `asyncHandler()` | ลบทิ้ง | Nest จับ rejected promise เอง |
| `errors.ts` → `ApiError` | คงไว้ (`common/errors/api-error.ts`) | ไม่ต้อง extends `HttpException` — ให้ filter จัดการ |
| `prisma.ts` singleton | `PrismaService extends PrismaClient` | ผูก lifecycle กับ Nest |
| `res.status(201).json(x)` | `@HttpCode(201)` + `return x` | |
| `res.status(204).send()` | `@HttpCode(204)` + `return` | |
| `req.user!.id` | `@CurrentUser()` custom decorator | |
| `req.hospitalKey!` | `@HospitalKey()` custom decorator | |
| `schema.parse(req.body)` | `@Body(new ZodValidationPipe(schema))` | |
| `express.json()` | Nest ทำให้อัตโนมัติ | ยกเว้น `/line` (ดู §5.1) |
| `cors({origin:true, credentials:true})` | `app.enableCors({ origin: true, credentials: true })` | ต้องเหมือนเดิมเป๊ะ |

---

## 4. Supabase Migration

### 4.1 หลักการ

Supabase = managed Postgres 15/17 + PgBouncer เราใช้เฉพาะส่วน database `schema.prisma` ไม่ต้องแก้ (`provider = "postgresql"` เหมือนเดิม) และ migration ทั้ง 7 ไฟล์ apply ได้ตรงๆ

### 4.2 สิ่งที่ต้องเพิ่ม: `DIRECT_URL`

นี่คือจุดที่คนพลาดบ่อยที่สุด Supabase ให้ connection string มา 2 แบบ และ Prisma ต้องใช้**ทั้งคู่**:

| ตัวแปร | Port | ใช้ตอน | เหตุผล |
|--------|------|--------|--------|
| `DATABASE_URL` | 6543 (pooler) | runtime query | PgBouncer transaction mode ประหยัด connection |
| `DIRECT_URL` | 5432 (direct) | `prisma migrate`, `prisma db push` | migration ต้องใช้ prepared statement / advisory lock ซึ่ง pooler ไม่รองรับ |

ต้องแก้ `schema.prisma` เพิ่ม 1 บรรทัด (นี่คือการแก้ schema เพียงจุดเดียวในเฟสนี้):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // ← เพิ่ม
}
```

และ `DATABASE_URL` ต้องต่อท้ายด้วย `?pgbouncer=true&connection_limit=1`

### 4.3 ขั้นตอนย้ายข้อมูล

1. สร้าง Supabase project → เก็บ password ของ `postgres` role
2. คัดลอก connection string ทั้ง 2 แบบจาก Project Settings → Database
3. รัน `npx prisma migrate deploy` ชี้ไปที่ Supabase (ใช้ `DIRECT_URL`) → ได้ตาราง + enum ครบ 5 ตาราง
4. รัน `npm run db:seed` → hospitals จาก `data/seed/bangkok_hospitals_gov_all.json` + demo accounts
5. ตรวจใน Supabase Table Editor ว่าตารางครบ: `users`, `hospitals`, `schedules`, `reserves`, `hospital_api_keys`
6. สร้าง **Supabase project แยกอีกตัว** (หรือ database แยก) สำหรับ test DB — ห้ามให้เทสต์ `deleteMany()` ยิงใส่ dev DB

### 4.4 RLS

Supabase เปิด Row Level Security เตือนใน dashboard เนื่องจากเราต่อ Postgres ด้วย `postgres` role ผ่าน Prisma (ไม่ผ่าน PostgREST) **RLS ไม่มีผลกับเรา** และ role นี้ bypass RLS อยู่แล้ว

> 🔒 **สำคัญ**: ห้าม expose `anon key` / `service_role key` และห้ามเปิด PostgREST API ให้ตารางเหล่านี้ เพราะยังไม่มี RLS policy — ใครมี anon key จะอ่าน `users` ได้ทั้งตาราง ถ้าจะใช้ Supabase client ในอนาคต (เฟส 2) ต้องเขียน policy ก่อน

---

## 5. จุดเสี่ยงทางเทคนิค (Technical Risks)

เรียงตามความน่าจะพัง จากมากไปน้อย

### 5.1 🔴 LINE webhook ต้องการ raw body

ปัจจุบัน `app.ts` mount `/line` **ก่อน** `express.json()` เพราะ `@line/bot-sdk` middleware ต้องคำนวณ HMAC จาก raw body

ใน Nest, body parser ทำงาน global ตั้งแต่ `NestFactory.create()` วิธีแก้:

```
NestFactory.create(AppModule, { rawBody: true })
```

แล้วอ่าน `req.rawBody` (Buffer) ใน `LineSignatureGuard` เพื่อ verify signature เอง แทนการใช้ `middleware()` ของ LINE SDK ตรงๆ

**ทางเลือกสำรอง**: ใช้ `NestExpressApplication` + `app.use('/line', express.raw({type:'*/*'}))` ก่อน `express.json()` ผ่าน `bodyParser: false` แล้ว mount เอง

**ต้องเทสต์**: ยิง webhook จริงจาก LINE Developers Console (Verify button) ก่อนปิดเฟส

### 5.2 🔴 Global prefix vs `/api/health` และ `/line`

ปัจจุบัน:
- `/api/health` — mount ตรงๆ ไม่ผ่าน router
- `/api/*` — ผ่าน router
- `/line/*` — ไม่มี prefix

ถ้าใช้ `app.setGlobalPrefix('api')` ตรงๆ `/line/webhook` จะกลายเป็น `/api/line/webhook` → **LINE webhook พัง**

วิธีแก้:

```
app.setGlobalPrefix('api', { exclude: ['line/(.*)'] })
```

หรือใช้ `@Controller({ path: 'line', ... })` ที่ตั้ง `exclude` ใน main.ts ให้ชัด และเขียน e2e test ยืนยันทั้ง `GET /api/health` และ `POST /line/webhook` ตอบถูก path

### 5.3 🟡 Zod ไม่ใช่ default ของ Nest

Nest มาพร้อม `ValidationPipe` + `class-validator` แต่เรามี Zod schema อยู่แล้วใน `validation/schemas.ts` และ `errorHandler` แปลง `ZodError.issues` → `details` map ที่ frontend พึ่งพา

**ตัดสินใจ**: ไม่ย้ายไป class-validator เขียน `ZodValidationPipe` แทน (~15 บรรทัด) แล้วให้มัน throw `ZodError` ต่อไป ให้ `AllExceptionsFilter` แปลงเหมือนเดิม → `details` shape ไม่เปลี่ยน

> ประหยัดเวลาและกำจัดความเสี่ยงเรื่อง error message ภาษาไทยเพี้ยนไปพร้อมกัน

### 5.4 🟡 `shared/` อยู่นอก `rootDir` ของ backend

`tsconfig.json` ปัจจุบันตั้ง `"rootDir": "../.."` เพื่อ import `../../shared/api.js` ได้ ทำให้ `outDir` กลายเป็น `dist/backend/src/...` (สังเกต `"start": "node dist/backend/src/index.js"`)

`nest build` ใช้ `tsconfig.build.json` และ `nest-cli.json` ต้องตั้ง:
- คง `rootDir: "../.."` ไว้ หรือ
- ตั้ง path alias `@shared/*` → `../shared/*` + `tsconfig-paths` ตอน runtime

**แนะนำ**: คง `rootDir` เดิม แล้วปรับ `nest-cli.json` → `"entryFile": "backend/src/main"` เพื่อไม่ให้ผิดเพี้ยนจาก build เดิม จุดนี้ควรทำเป็นสิ่งแรกและ verify ด้วย `npm run build && npm start` ก่อนย้ายโค้ดจริง

### 5.5 🟡 ESM vs CommonJS

โปรเจกต์ปัจจุบันเป็น `"type": "module"` + `moduleResolution: "Bundler"` + import ลงท้าย `.js`

NestJS decorator + DI ทำงานได้ดีที่สุดบน CommonJS (`emitDecoratorMetadata` + `reflect-metadata`)

**ตัดสินใจ (ตามที่ทำจริง)**: เปลี่ยนเป็น CJS ผ่าน **`"module": "Node16"`** แทน `"commonjs"` ตรงๆ — โหมดนี้ TypeScript ยัง map `./foo.js` → `./foo.ts` ให้ จึง**ไม่ต้องลบ `.js` suffix แม้แต่จุดเดียว** (แผนเดิมประเมินไว้ ~40 จุด) แค่:
- ลบ `"type": "module"` จาก `package.json` ของ backend และ `shared/`
- เพิ่ม `experimentalDecorators` + `emitDecoratorMetadata`
- แก้ `import.meta.url` → `__dirname` (มีจริงแค่ 1 จุดใน `prisma/seed.ts`)

**Bug ที่เจอระหว่างทำ**: `rootDir: "../.."` เดิมชี้เลย repo root ไปหนึ่งชั้น ทำให้ `npm start` เดิมพังมาตลอด (ไม่มีใครสังเกตเพราะ deploy ผ่าน Vercel ที่ build `api/index.ts` เอง) — แก้เป็น `".."`

### 5.6 🟡 Status code ที่ Nest เปลี่ยนให้เองโดยไม่บอก

Nest default: `POST` → **201**, method อื่น → **200**

ตรวจทีละตัว:

| Endpoint | ปัจจุบัน | Nest default | ต้องทำ |
|---|---|---|---|
| `POST /auth/register` | 201 | 201 | ✅ ตรงกัน |
| `POST /auth/login` | **200** | 201 | ⚠️ ต้องใส่ `@HttpCode(200)` |
| `POST /auth/logout` | **204** | 201 | ⚠️ ต้องใส่ `@HttpCode(204)` |
| `POST /appointments` | 201 | 201 | ✅ |
| `POST /api-keys/requests` | 201 | 201 | ✅ |
| `POST /hospital/reserves` | 201 | 201 | ✅ |
| `PATCH /hospital/reserves/:id/status` | 200 | 200 | ✅ |

`POST /auth/login` คือตัวที่จะพังเงียบที่สุด เพราะ frontend อ่าน body ได้ปกติแต่ status ผิด

### 5.7 🟢 Route ordering: `/appointments/me` vs `/appointments/:id`

Express match ตามลำดับที่ register → `/me` มาก่อน `/:id` จึงทำงานถูก
Nest ก็ match ตามลำดับ method ใน class เช่นกัน → **ต้องประกาศ `@Get('me')` ก่อน `@Get(':id')`** ใน `AppointmentsController` ไม่งั้น `/me` จะถูกจับเป็น `id = "me"` แล้วตอบ 404

เขียน e2e test คุมไว้

### 5.8 🟢 Prisma connection lifecycle

Vercel serverless เดิมสร้าง `PrismaClient` ที่ module scope Railway/Render เป็น long-lived process → ใช้ `PrismaService implements OnModuleInit, OnModuleDestroy` แล้วเรียก `$connect()` / `$disconnect()` ให้ถูกจังหวะ + `enableShutdownHooks` เพื่อให้ graceful shutdown ปิด connection กับ Supabase pooler

---

## 6. Environment Variables

### 6.1 ตัวแปรทั้งหมดหลัง migration

```bash
# ── Database (Supabase) ───────────────────────────
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# ── App ───────────────────────────────────────────
PORT=4000
NODE_ENV=production
JWT_SECRET=""            # required — bootstrap ต้อง fail ถ้าไม่มี
CORS_ORIGIN="*"          # ใหม่: ปัจจุบัน hardcode origin:true

# ── LINE ──────────────────────────────────────────
LINE_CHANNEL_SECRET=""
LINE_CHANNEL_TOKEN=""
LIFF_ID=""

# ── Google Sheets (optional) ──────────────────────
GOOGLE_APPS_SCRIPT_URL=""

# ── Legacy (ยังใช้อยู่?) ──────────────────────────
DATA_GO_TH_API_KEY=""    # ตรวจว่ายังใช้จริงไหม ถ้าไม่ ลบทิ้ง
```

### 6.2 Config validation

ปัจจุบัน `config.ts` มีฟังก์ชัน `required()` ง่ายๆ เปลี่ยนเป็น `ConfigModule.forRoot({ validate })` โดยใช้ Zod schema ตัวเดียวกัน — ให้ **process ตายตอน boot** ถ้า env ขาด ดีกว่าตายตอนมี request เข้ามา

ปัจจุบัน `LINE_CHANNEL_SECRET` fallback เป็น `''` เงียบๆ (`?? ''`) ทำให้ webhook พังแบบไม่มี error ที่ชัด → เฟสนี้ทำให้มัน required (หรือ optional แบบตั้งใจ + log warning)

---

## 7. Testing Strategy

### 7.1 หลักการ: เทสต์เดิมคือ contract test

`src/test/*.test.ts` ทั้ง 8 ไฟล์ใช้ Supertest ยิง HTTP จริง — **assertion เหล่านี้คือสัญญาของเฟส 1** ทุกอันที่ต้องแก้มากกว่า import path = สัญญาณว่า contract เปลี่ยน = bug

| ไฟล์เดิม | ปลายทาง | หมายเหตุ |
|---|---|---|
| `health.test.ts` | `test/e2e/health.e2e-spec.ts` | ยืนยัน global prefix ไม่ซ้อน |
| `auth.test.ts` | `test/e2e/auth.e2e-spec.ts` | ระวัง status 200/204 |
| `hospital.test.ts` | `test/e2e/hospitals.e2e-spec.ts` | |
| `appointment.test.ts` | `test/e2e/appointments.e2e-spec.ts` | รวม `/me` vs `/:id` ordering |
| `hospitalKey.test.ts` | `test/e2e/hospital-api.e2e-spec.ts` | |
| `mappers.test.ts` | `test/unit/mappers.spec.ts` | pure — ย้ายตรงๆ |
| `schema.test.ts` | `test/unit/schemas.spec.ts` | pure — ย้ายตรงๆ |
| `seed.test.ts` | `test/e2e/seed.e2e-spec.ts` | |

### 7.2 การเปลี่ยนแปลง

- `makeTestApp()` → `Test.createTestingModule({ imports: [AppModule] }).compile()` แล้ว `app.init()`
- ต้องเรียก `setGlobalPrefix` / `useGlobalFilters` / `rawBody` ใน test bootstrap **ให้ตรงกับ `main.ts` เป๊ะ** ไม่งั้นเทสต์ผ่านแต่ prod พัง → แยกออกเป็นฟังก์ชัน `configureApp(app)` ที่ทั้ง `main.ts` และ test เรียกร่วมกัน
- `resetDb()` ใช้ต่อได้ ลำดับลบ (children → parents) ยังเหมือนเดิม
- `fileParallelism: false` → Jest ใช้ `--runInBand` (เหตุผลเดียวกัน: share test DB)
- เพิ่มเทสต์ใหม่ 2 ตัวที่ยังไม่มี: **LINE signature verification** และ **`POST /line/webhook` ตอบ 200**

### 7.3 Contract regression check

ก่อนปิดเฟส รัน backend เก่าและใหม่พร้อมกัน (คนละ port) แล้วยิง request ชุดเดียวกันเทียบ status + body byte-for-byte ทำเป็น script ชั่วคราวก็พอ ไม่ต้อง commit

---

## 8. แผนดำเนินการ (Step-by-step)

แต่ละขั้นควร commit แยก และทุกขั้นที่มี ✅ ต้องรันเทสต์เดิมผ่านก่อนไปต่อ

### Stage 0 — เตรียมพื้นที่ (ไม่แตะโค้ดเดิม)

1. สร้าง Supabase project (dev + test) เก็บ connection string
2. เพิ่ม `directUrl` ใน `schema.prisma`
3. `prisma migrate deploy` + `db:seed` ชี้ Supabase
4. ✅ **รันเทสต์เดิมทั้งหมดโดยชี้ DB ไป Supabase** — ต้องเขียวก่อนแตะ NestJS
   > จุดนี้แยก "ความเสี่ยงจากการย้าย DB" ออกจาก "ความเสี่ยงจากการย้าย framework" ได้เด็ดขาด ถ้าข้ามขั้นนี้ เวลาพังจะไม่รู้ว่าพังเพราะอะไร

### Stage 1 — ตั้ง NestJS skeleton

5. ติดตั้ง `@nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config @nestjs/jwt reflect-metadata rxjs`
6. เปลี่ยน `tsconfig` เป็น CommonJS + `experimentalDecorators` + `emitDecoratorMetadata`; ลบ `.js` suffix ใน import ทุกจุด; แก้ `import.meta.url` 2 จุด
7. สร้าง `main.ts` + `AppModule` เปล่า + `PrismaModule` + `ConfigModule`
8. ย้าย `errors.ts` → `ApiError` และเขียน `AllExceptionsFilter` (ให้ output ตรง §2.8)
9. เขียน `ZodValidationPipe`
10. ทำ endpoint แรกตัวเดียว: `GET /api/health`
11. ✅ `health.test.ts` (port แล้ว) ผ่าน + `npm run build && npm start` ทำงาน

### Stage 2 — ย้าย module ทีละตัว (ไม่แตะ business logic)

ลำดับนี้เลือกจากพึ่งพาน้อย → มาก

12. `HospitalsModule` (public, ไม่มี auth) → ✅ `hospitals` e2e ผ่าน
13. `AuthModule` + `JwtAuthGuard` → ✅ `auth` e2e ผ่าน (ระวัง §5.6)
14. `AppointmentsModule` → ✅ `appointments` e2e ผ่าน (ระวัง §5.7)
15. `HospitalApiModule` + `HospitalKeyGuard` → ✅ `hospital-api` e2e ผ่าน
    - ตอนนี้แยก logic ออกจาก `hospitalReserve.controller.ts` ไปเป็น service ด้วย (controller เดิมหนาเกินไป)
16. `ApiKeysModule` + `SheetsService` → ✅ ผ่าน
17. `LineModule` — ตัวสุดท้ายเพราะเสี่ยงสุด (§5.1, §5.2)
    - แยก Flex builder ~500 บรรทัดออกเป็น `flex-messages.ts` ตามเดิมทุกตัวอักษร
    - ✅ Verify webhook จาก LINE Console จริง

### Stage 3 — เก็บงาน

18. ปรับ `scripts/gen-key.ts` และ `revoke-key.ts` (แค่ import path)
19. ปรับ `prisma/seed.ts` (`__dirname`)
20. ลบไฟล์เก่า: `app.ts`, `routes/`, `controllers/`, `middleware/`, `index.ts`
21. เปลี่ยน `package.json` scripts: `nest start --watch`, `nest build`, `jest`
22. ✅ **รันเทสต์ทั้งชุด + contract regression check (§7.3)**

### Stage 4 — Deploy

23. ตั้ง Railway/Render service: build `npm run build`, start `node dist/backend/src/main.js`
24. ตั้ง env ครบตาม §6.1 (`DIRECT_URL` ด้วย)
25. ตั้ง `prisma migrate deploy` เป็น release command
26. Health check path: `/api/health`
27. อัปเดต LINE webhook URL → domain ใหม่
28. ชี้ frontend (`VITE_API_BASE_URL`) ไป backend ใหม่ **โดยไม่แก้โค้ด frontend**
29. Smoke test บน production: register → login → search → book → QR

### Rollback plan

ทำงานบน branch แยก (`backend-nest`) ไม่ merge จนกว่า Stage 4.29 ผ่าน
Backend เดิมบน Vercel ยังรันอยู่ตลอด → rollback = เปลี่ยน `VITE_API_BASE_URL` กลับ + ชี้ LINE webhook กลับ
Supabase DB ใช้ร่วมกันได้ทั้งสองตัว (schema เดียวกัน) จึงไม่มีปัญหา data divergence

---

## 9. Known Issues (ไม่แก้ในเฟสนี้ — ยกไปเฟส 2)

บันทึกไว้เพื่อไม่ให้ลืม ทั้งหมดนี้ **ห้ามแก้ระหว่างเฟส 1** เพราะจะทำให้แยกไม่ออกว่า test ที่แดงมาจาก migration หรือจากการแก้ logic

1. **Race condition ใน capacity check** — `createAppointment` และ `createReserve` ใช้ `count()` แล้วเทียบ `maxCapacity` ในทรานแซกชันที่ isolation level เป็น `READ COMMITTED` (default) → จองพร้อมกันสองคนแล้วเกิน capacity ได้ แก้ด้วย unique constraint บน `(hospitalId, scheduleId, date, queueNumber)` หรือยก isolation เป็น `Serializable`
2. **โค้ดซ้ำ** — `generateBookingCode`, `randomRef`, `RESERVE_INCLUDE`, และ logic การจองทั้งก้อน ถูก copy-paste อยู่ทั้งใน `appointment.service.ts` และ `hospitalReserve.controller.ts` → เฟส 1 ย้ายไปคนละ module แต่ยังซ้ำ เฟส 2 ควรรวมเป็น `ReserveService` เดียว
3. **`Schedule` ไม่ผูกกับ `Hospital`** — เป็น global weekly template ที่ทุก รพ. ใช้ตารางเดียวกัน (`@@unique([dayOfWeek, startTime])`) ถ้าเฟส 2 ต้องการให้แต่ละ รพ. มีเวลาเปิดต่างกัน ต้อง migrate schema
4. **`queueNumber` คำนวณจาก `booked + 1`** — ถ้ามีการยกเลิก คิวจะซ้ำ
5. **`GET /api/scanned/:id` เป็น public** — ใครรู้ `id` (cuid) อ่านชื่อ-นามสกุลผู้ป่วยได้ ควรพิจารณา signed token ใน QR
6. **ไม่มี rate limiting** ทั้ง `/auth/login` และ `/hospital/*` → เฟส 2 ใส่ `@nestjs/throttler`
7. **ไม่มี structured logging / request id** → เฟส 2 ใส่ `nestjs-pino`

---

## 10. Definition of Done (Phase 1)

- [ ] เทสต์ทั้งหมด (unit + e2e) เขียวบน CI
- [ ] `npm run build` + `npm start` ทำงานบน Node 20
- [ ] ทุก endpoint ใน §2 ตอบ status + body เหมือน backend เดิม (ยืนยันด้วย regression script §7.3)
- [ ] `GET /api/health` ไม่กลายเป็น `/api/api/health`
- [ ] `POST /line/webhook` ผ่านการ Verify จาก LINE Developers Console จริง
- [ ] `POST /auth/login` ตอบ 200 (ไม่ใช่ 201) และ `logout` ตอบ 204
- [ ] Prisma ต่อ Supabase ผ่าน pooler และ `migrate deploy` ผ่าน `DIRECT_URL`
- [ ] Frontend เดิม (ไม่แก้โค้ด) ทำ flow ครบ: register → login → ค้นหา รพ. → จอง → ดู QR
- [ ] ไฟล์ใน `shared/` ไม่มี diff แม้แต่บรรทัดเดียว
- [ ] `app.ts`, `routes/`, `controllers/`, `middleware/` ถูกลบออกหมด

---

# Phase 2 — New Features (ร่าง)

รอกำหนดรายละเอียด หัวข้อที่คาดว่าจะครอบคลุม:

- Endpoint ใหม่สำหรับฟีเจอร์ใหม่ (รอ requirement)
- แก้ Known Issues §9 ตามลำดับความสำคัญ (เริ่มจากข้อ 1 และ 5 ซึ่งเป็นเรื่อง correctness และ privacy)
- พิจารณาใช้ Supabase Realtime สำหรับสถานะคิว และ Supabase Storage สำหรับเอกสารแนบ — ทั้งคู่ต้องเขียน RLS policy ก่อน (§4.4)
