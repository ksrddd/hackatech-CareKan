# CareKan — Frontend

React 18 + TypeScript + Vite + Tailwind CSS, ทั้ง 2 ฝั่ง (Citizen + Admin)
ในที่เดียว ใช้ mock data ทั้งหมด — ยังไม่เชื่อม backend.

## รันบนเครื่อง

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # ตรวจ TypeScript ทั้งโปรเจกต์
npm run build        # production build → ./dist
npm run preview      # serve ./dist เพื่อทดสอบ
```

ต้องการ Node.js 20+ และ npm 10+

## บัญชี demo

| Role | เลขบัตรประจำตัวประชาชน | รหัสผ่าน |
|---|---|---|
| Citizen | `1234567890123` | อะไรก็ได้ ≥ 4 ตัวอักษร |
| Admin | `9876543210987` | อะไรก็ได้ ≥ 4 ตัวอักษร |

## โครงสร้างโฟลเดอร์

```
src/
├── main.tsx                          # bootstrap React
├── App.tsx                           # router + provider stack
├── styles/globals.css                # Tailwind + design tokens จาก mockup
├── lib/
│   ├── types.ts                      # TS domain types
│   ├── mockData.ts                   # hospitals, slots, appointments, users
│   ├── format.ts                     # Thai date/time/ID formatting
│   ├── auth.tsx                      # mock AuthProvider
│   ├── elderlyMode.tsx               # โหมดผู้สูงวัย Provider
│   └── bookingsStore.tsx             # in-memory + localStorage bookings
├── components/
│   ├── Citizen/AdminLayout.tsx       # shared layouts (header + footer + skip link)
│   ├── GovBar, GovLogo, GovFooter    # gov.bangkok style chrome
│   ├── ElderlyToggle, SkipLink       # a11y primitives
│   ├── ProtectedRoute.tsx            # RBAC gate
│   ├── BookingStepper.tsx
│   ├── HospitalCard.tsx
│   ├── DateGrid.tsx + TimeSlotGrid.tsx
│   ├── QueueStatusBadge.tsx
│   ├── QrStub.tsx + Announcement.tsx
└── pages/
    ├── Landing.tsx
    ├── Login.tsx + Register.tsx
    ├── HospitalSearch.tsx + HospitalDetail.tsx
    ├── BookAppointment.tsx + BookSuccess.tsx
    ├── MyAppointments.tsx + AppointmentDetail.tsx
    └── admin/
        ├── AdminDashboard.tsx
        └── QueueView.tsx
```

## เส้นทาง

| Path | หน้า | ต้อง login? |
|---|---|---|
| `/` | Landing | ❌ |
| `/login` | เข้าสู่ระบบ | ❌ |
| `/register` | สมัครใช้งาน (4 ขั้นตอน) | ❌ |
| `/search` | ค้นหาโรงพยาบาล | ❌ |
| `/hospitals/:id` | รายละเอียดโรงพยาบาล | ❌ |
| `/my-appointments` | นัดหมายของฉัน | citizen |
| `/appointments/:id` | รายละเอียดนัด + queue สดทุก 5s | citizen |
| `/book?hospital=...` | จองคิว 3 ขั้นตอน | citizen |
| `/book/success/:id` | หน้าสำเร็จ + QR | citizen |
| `/admin` | Dashboard เจ้าหน้าที่ | admin |
| `/admin/queue` | จัดการคิววันนี้ | admin |

## Mock data persistence

- `carekan.auth.userId` — current logged-in user
- `carekan.elderlyMode` — `'1'` = on
- `carekan.bookings` — booking ที่สร้างใหม่จาก UI
- `carekan.statusOverrides` — สถานะที่ admin update ผ่าน QueueView

ล้างทั้งหมดด้วย `localStorage.clear()` ใน DevTools.

## ที่ตั้งใจไม่ทำในรอบนี้

- ไม่มี backend จริง — login ตรวจกับ MOCK_USERS เท่านั้น
- ไม่มี QR scan logic — `<QrStub>` วาดแค่ลายเฉย ๆ
- ไม่มี SMS / LINE / email
- ไม่มี PDF download (พิมพ์ผ่าน `window.print()` ได้)
- ไม่มี reschedule / cancel
- ไม่มี caregiver / book-for-family
- ไม่มี AI assistant
- ไม่มี real geolocation — `distance` เป็น static string ใน mock

ทั้งหมดข้างต้นมีไว้ใน docx เป็น Nice-to-have แล้ว.
