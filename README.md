# CareKan — แคร์กัน ไม่ขาดตอน

ระบบนัดหมายโรงพยาบาลรัฐในเครือสำนักการแพทย์ กรุงเทพมหานคร
ทีม **เจ็ดจริงดิ!** · HacKaTech 2026 · PEOPLE Track

> **สถานะ:** Hackathon prototype · ปัจจุบันมีเฉพาะ `frontend/` (Must-have UI + mock data)
> · `backend/` (Express + Prisma + Postgres) จะตามมา
> · **Private repository — ห้ามแชร์ลิงก์/clone ออกนอกทีม**

---

## ⚡ Quick start

```bash
git clone https://github.com/<org>/hackatech-CareKan.git
cd hackatech-CareKan/frontend
npm install
npm run dev
```

แล้วเปิด <http://localhost:5173> ใน browser. ใช้บัญชี demo ด้านล่าง.

ถ้าติดขัด ดู [Troubleshooting](#troubleshooting) ก่อน.

---

## ความต้องการก่อนรัน

| Tool | เวอร์ชันต่ำสุด | ตรวจด้วย |
|---|---|---|
| Node.js | **20.x** (LTS) | `node -v` |
| npm | **10.x** | `npm -v` |
| Git | 2.30+ | `git --version` |
| Browser | Chrome / Edge / Firefox รุ่นล่าสุด | — |

ถ้ายังไม่มี Node.js: ดาวน์โหลด LTS ที่ <https://nodejs.org/en/download/>
(แนะนำใช้ [nvm-windows](https://github.com/coreybutler/nvm-windows) บน Windows
หรือ [nvm](https://github.com/nvm-sh/nvm) บน Mac/Linux เพื่อสลับเวอร์ชันสะดวก)

---

## ขั้นตอนติดตั้งและรัน

### 1. Clone repo (private)

```bash
git clone https://github.com/<org>/hackatech-CareKan.git
cd hackatech-CareKan
```

ถ้า GitHub ขอ login ให้ใช้ Personal Access Token (PAT) แทนรหัสผ่าน — ดู
<https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>

### 2. ติดตั้ง dependencies

```bash
cd frontend
npm install
```

ใช้เวลาประมาณ **30 วินาที – 1 นาที** (188 packages). ถ้าเครื่องช้าหรือ npm registry
ขัดข้อง ลอง `npm install --registry=https://registry.npmjs.org/`

### 3. รัน dev server

```bash
npm run dev
```

จะเห็นข้อความประมาณนี้:

```
  VITE v5.4.x  ready in 313 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.x.x.x:5173/
```

เปิด <http://localhost:5173>. Hot reload ทำงานทันทีตอนแก้ไฟล์.

### 4. หยุดเซิร์ฟเวอร์

กด <kbd>Ctrl</kbd> + <kbd>C</kbd> ใน terminal.

---

## npm scripts ที่ใช้บ่อย

| Command | ใช้ตอน |
|---|---|
| `npm run dev` | รันโหมด development + hot reload (ใช้ทุกวัน) |
| `npm run typecheck` | ตรวจ TypeScript ทั้งโปรเจกต์ — **รันก่อน push ทุกครั้ง** |
| `npm run build` | สร้าง production build ใน `frontend/dist/` |
| `npm run preview` | serve `dist/` เพื่อเทสต์ production locally |

---

## บัญชี demo

| Role | เลขบัตรประจำตัวประชาชน (13 หลัก) | รหัสผ่าน |
|---|---|---|
| ผู้ใช้ทั่วไป (Citizen) | `1234567890123` | อะไรก็ได้ ≥ 4 ตัวอักษร |
| เจ้าหน้าที่ (Admin) | `9876543210987` | อะไรก็ได้ ≥ 4 ตัวอักษร |

หลัง login ระบบ redirect ตาม role:

- Citizen → `/my-appointments`
- Admin → `/admin`

> ข้อมูลทั้งหมดเป็น mock เก็บใน `localStorage` ของ browser ตัวเอง — ไม่มีการส่งออกไปไหน

---

## Demo script (end-to-end สำหรับกรรมการ)

ใช้เวลาประมาณ **3 นาที** ครอบคลุม Acceptance Criteria ครบทุกข้อ.

1. **`/`** → กดปุ่ม **"เริ่มใช้งานฟรี"** → สาธิตขั้นตอนสมัคร 4 ขั้น (PDPA → ข้อมูล → ติดต่อ → รหัสผ่าน) แล้วกลับมา login
2. **`/login`** → ใส่ `1234567890123` + รหัสอะไรก็ได้ → เห็น loading 120 ms → เข้าสู่ระบบ
3. **`/my-appointments`** → มีนัดมาให้ 2 รายการ + ประวัติ 3 ครั้ง
4. **`/search`** → กรองตามเขต/บริการ → เลือก **รพ.กลาง**
5. **`/hospitals/klang`** → กด **"จองคิว"**
6. **`/book`** ขั้น 1 → เลือกคลินิกอายุรกรรม + วัตถุประสงค์ "นัดติดตามอาการ"
7. **`/book`** ขั้น 2 → เลือกวันที่ในปฏิทิน → เลือกช่วงเวลา 09:30
8. **`/book`** ขั้น 3 → ตรวจรายละเอียด → กด **"ยืนยันการจอง"**
9. **`/book/success/:id`** → เห็นหมายเลขจอง `CK-XXXXXX` + เลขคิว `A0xx` + QR placeholder
10. กดดู **"สถานะนัดหมาย"** → เห็นคิวสดอัปเดตทุก 5 วินาที (คิวปัจจุบัน · รอก่อนคุณ · หมายเลขคุณ)
11. **logout** → login ด้วย admin (`9876543210987`)
12. **`/admin`** → เห็น KPI 6 ตัว + กราฟ + รายการล่าสุด + ห้องตรวจ + ยังไม่ check-in
13. **`/admin/queue`** → กด **"เรียกคิวถัดไป"** หรือกด **"เรียก"** บน row → สถานะอัปเดต
14. (Optional) เปิด tab ใหม่ login citizen — เห็นสถานะคิวขยับขึ้น (cross-tab sync ผ่าน localStorage)
15. ดูภาพรวมระบบที่ **`/user-flow`** — มี SVG diagram + route map + อธิบาย data sync ระหว่าง citizen/admin

---

## โครงสร้าง repo

```
hackatech-CareKan/
├── README.md                         ← คุณกำลังอ่านอยู่
├── shared/                           ← Wire types (FE+BE single source)
│   ├── types.ts                      ← Domain DTOs (User, Hospital, Appointment, ...)
│   └── api.ts                        ← HTTP request/response per endpoint + RBAC table
│
├── frontend/                         ← React 18 + TS + Vite + Tailwind
│   ├── package.json + tsconfig + vite.config + tailwind.config + postcss
│   ├── README.md                     ← FE-specific detail (route list ฯลฯ)
│   ├── index.html
│   └── src/
│       ├── main.tsx + App.tsx        ← bootstrap + router + provider stack
│       ├── styles/globals.css        ← Tailwind + design tokens จาก mockup
│       ├── lib/                      ← Context providers + utils + mock data
│       │   ├── auth.tsx              ← AuthProvider (mock login, localStorage)
│       │   ├── elderlyMode.tsx       ← โหมดผู้สูงวัย toggle
│       │   ├── bookingsStore.tsx     ← in-memory + localStorage bookings
│       │   ├── mockData.ts           ← 9 รพ. กทม. + clinics + slots + appointments
│       │   ├── format.ts             ← Thai date/time/ID formatting
│       │   └── types.ts              ← re-export จาก shared/types
│       ├── shared/                   ← FE-only helpers (เมื่อ backend lands ใช้ทุกที่)
│       │   ├── api/client.ts         ← apiFetch + ApiError + setAuthToken
│       │   ├── api/endpoints.ts      ← typed api.login() / api.createAppointment() / ...
│       │   └── state/useRequest.ts   ← RequestState DU + useRequest + useQuery
│       ├── components/               ← shared UI (Layout, Header, Stepper, ...)
│       └── pages/                    ← screens
│           ├── Landing.tsx · Login.tsx · Register.tsx
│           ├── HospitalSearch.tsx · HospitalDetail.tsx
│           ├── BookAppointment.tsx · BookSuccess.tsx
│           ├── MyAppointments.tsx · AppointmentDetail.tsx
│           └── admin/
│               ├── AdminDashboard.tsx
│               └── QueueView.tsx
│
└── backend/                          ← (ยังไม่มี — รออัน + ซี + เบส)
```

---

## ใครแตะอะไร (เพื่อไม่ให้ชน merge)

| คน | บทบาทใน Hackathon | ไฟล์/โฟลเดอร์หลัก |
|---|---|---|
| ผิงผิง (Virada) | Project Lead | `README.md`, Pitch Deck (Google Slides — นอก repo) |
| วิอันนา (Jinnanupas) | Business Analyst | `docs/personas.md` (ยังไม่สร้าง) |
| ขนมจีน (Rassapat) | Researcher | `docs/research-refs.md` (ยังไม่สร้าง) |
| **ขุมทรัพย์ (Sukhum)** | Frontend / UI / Test | `frontend/src/pages/*.tsx` (ฝั่ง citizen), `frontend/src/styles/`, `frontend/src/i18n/` (อนาคต) |
| **อัน (Anawat)** | Backend / Auth / Integration | `backend/` (ทั้งหมด), `shared/api.ts`, `frontend/src/shared/api/endpoints.ts` |
| **เบส (Korawich)** | ER / Admin FE / QA | `docs/ER-diagram.md` (ยังไม่สร้าง), `frontend/src/pages/admin/*`, `frontend/src/components/{HospitalCard,DateGrid,TimeSlotGrid,QueueStatusBadge}.tsx` |
| **ซี (Insi)** | DB schema / Mock data / Services | `backend/prisma/`, `frontend/src/lib/mockData.ts`, `backend/src/services/` |

> โดยทั่วไป: ถ้าจะแตะไฟล์ที่ "ไม่ใช่ของเรา" — pull main ล่าสุดก่อน + แจ้งใน Discord/LINE ก่อน push

---

## Coding conventions (สำคัญ)

### 1. ห้ามใช้ `any`

ใช้ `unknown` + type guard, generics, หรือ shared types แทน. ESLint ยังไม่ได้ใส่
(เป็น guardrail ของ hackathon — ดูใน rationale ใน frontend/README.md) แต่
`npm run typecheck` จะร้องเองถ้ามีปัญหา.

### 2. รัน `npm run typecheck` **ก่อน push ทุกครั้ง**

```bash
cd frontend
npm run typecheck
```

ใช้เวลา ~2 วินาที. ถ้าไม่ผ่าน อย่า push.

### 3. ใช้ types จาก `shared/types.ts` เป็น single source

```tsx
// ✅ ใช้
import type { Appointment, Hospital } from '@/lib/types';

// ❌ อย่าเขียน type ซ้ำ
interface Appointment { ... }
```

### 4. ฟอร์มต้อง disable submit ระหว่างกำลังบันทึก

Template อยู่ที่ `frontend/src/pages/Login.tsx` ที่ใช้ `useRequest` แล้ว.
เมื่อเชื่อม backend ให้ทุก form ใช้ pattern เดียวกัน.

### 5. PDPA ownership check บนข้อมูลส่วนบุคคล

ทุกครั้งที่ดึง `Appointment` รายตัวสำหรับ citizen ต้องส่ง `requireOwnerUserId`:

```tsx
// ✅
const appt = getBooking(id, { requireOwnerUserId: user.id });

// ❌ — เปิดช่องให้ดู appointment ของคนอื่นด้วย ID
const appt = getBooking(id);
```

### 6. คอมเมนต์เฉพาะ "ทำไม" ไม่ใช่ "ทำอะไร"

ชื่อ identifier บอก "ทำอะไร" อยู่แล้ว. คอมเมนต์ใช้กับ workaround, hidden constraint,
ที่มาของ magic number, หรือพฤติกรรมแปลก ๆ.

---

## Troubleshooting

### ❓ `npm install` ค้าง / error

```bash
# ลบ node_modules + lock + ติดตั้งใหม่
cd frontend
rm -rf node_modules package-lock.json
npm install
```

Windows ใช้ PowerShell: `Remove-Item -Recurse -Force node_modules, package-lock.json`

### ❓ Port 5173 ถูกใช้แล้ว

```bash
# Vite จะหา port ถัดไปอัตโนมัติ (5174, 5175, ...) อ่าน URL ใน console
# ถ้าอยากกำหนดเอง:
npm run dev -- --port 3000
```

### ❓ หน้าจอเพี้ยน / state ค้าง

```javascript
// เปิด DevTools (F12) → Console:
localStorage.clear();
location.reload();
```

จะรีเซ็ตทั้ง auth, elderly mode, bookings ที่จองเพิ่ม, status overrides.

### ❓ "Cannot find module '@/lib/types'"

restart dev server (`Ctrl+C` แล้วรัน `npm run dev` ใหม่) หรือ restart TS server ใน
VS Code (`Ctrl+Shift+P` → "TypeScript: Restart TS Server")

### ❓ Hot reload ไม่ทำงาน

- Save แล้วยัง? บางเครื่อง Save อัตโนมัติไม่ทำงาน
- ไฟล์ใน `src/` หรือเปล่า? ไฟล์นอก `src/` ไม่ trigger hot reload
- ลอง full reload: `Ctrl+Shift+R` ใน browser

### ❓ Build error: "Cannot resolve '../../../shared/types'"

Path อยู่ที่ระดับไหนเทียบกับ `frontend/`? ถ้าไฟล์ใน `frontend/src/lib/` ใช้
`../../../shared/types`. ถ้าใน `frontend/src/shared/api/` ใช้ `../../../../shared/api`.
(เหตุผลที่ไม่ใช้ alias: ดู comment ใน `vite.config.ts`)

### ❓ Build บนเครื่องอื่นพังแต่บน main ผ่าน

```bash
# Check Node version ตรงไหม
node -v   # ต้อง 20.x

# clean + reinstall
rm -rf frontend/node_modules frontend/dist
cd frontend && npm install && npm run build
```

---

## Editor setup (แนะนำ VS Code)

Extensions ที่แนะนำ:

- **ESLint** (Microsoft) — แม้ไม่ได้ตั้ง config แต่เห็น TS error ใน editor
- **Tailwind CSS IntelliSense** (Tailwind Labs) — autocomplete class
- **Pretty TypeScript Errors** (yoavbls) — อ่าน type error ง่ายขึ้น
- **Error Lens** (Alexander) — แสดง error inline กับโค้ด
- **GitLens** (GitKraken) — ดู blame ตอน merge

Settings แนะนำ (`.vscode/settings.json` ในเครื่องตัวเอง):

```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Ethics / PDPA quick rules

- **Data minimization**: เก็บเฉพาะข้อมูลที่จำเป็น (ชื่อ-นามสกุล, เลข ปชช., วันเกิด, เพศ,
  เบอร์โทร, อีเมล, สิทธิ์การรักษา, รหัสผ่าน hash). **ห้าม** เก็บอาการ/การวินิจฉัย/ผลแลป
  ใน prototype.
- **RBAC**: `/` (citizen) กับ `/admin` (เจ้าหน้าที่) แยกกัน — ProtectedRoute เช็ค role,
  `getBooking` เช็ค owner.
- **Auth required**: ทุก route ที่เห็นข้อมูลส่วนบุคคล (`/my-appointments`,
  `/appointments/:id`, `/book`, `/admin/*`) ต้อง login ก่อน.
- **Private repo**: **ห้าม** push เป็น public · ห้ามแชร์ลิงก์/clone นอกทีม · ห้าม commit
  `.env` หรือ credential.

---

## Status snapshot

### ✅ พร้อมใช้

- หน้าบ้าน 11 หน้า (Landing, Login, Register, Search, Hospital, Book wizard 3 step,
  Success, MyAppointments, AppointmentDetail) + Admin 2 หน้า (Dashboard, QueueView)
- Mock data 9 รพ. กทม. + 12 demo appointments + slot generator
- โหมดผู้สูงวัย + skip link + ARIA labels + focus rings ครบ
- Shared types + typed API client reference + RequestState DU pattern
- PDPA ownership check + lazy-loaded admin bundle
- Typecheck + production build ผ่าน

### ⏳ รอทำ (ใน 2 วัน)

- Backend (Express + Prisma + Postgres) — owner: อัน + ซี + เบส
- เชื่อม form submit ทุกหน้ากับ API ผ่าน `useRequest` (template มีแล้ว)
- ER diagram doc — owner: เบส
- API spec doc — owner: อัน

### ❌ ตั้งใจไม่ทำในรอบนี้ (nice-to-have)

QR scan check-in (จริง), SMS/LINE/Email notification, PDF download, BTS/MRT routing,
สิทธิ์ API integration, caregiver/family booking, AI chatbot — ยัง stub UI หรือไม่มี.

---

## ลิงก์เอกสารอื่น

- [`frontend/README.md`](frontend/README.md) — detail การ run + route list + localStorage keys
- `hackatech-design-flow/` (ภายนอก repo) — Mockups + design system source

ติดต่อทีม: ผ่าน Discord/LINE ของทีมเจ็ดจริงดิ! · Project Lead: ผิงผิง (Virada)
