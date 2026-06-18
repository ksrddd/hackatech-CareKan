import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, type ClinicCode, type InsuranceRight, type ServiceType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { zoneForDistrict } from '../data/bangkok-zones.js';

interface GovHospitalRaw {
  name: string;
  name_eng: string | null;
  address: string;
  dcode: number | null;
  dname: string | null;
  tel: string | null;
  url: string | null;
  num_bed: number | null;
  belong: string;
  type: string | null;
  lat: number | null;
  lng: number | null;
  sector: 'government';
}

const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));

function loadGovHospitals(): GovHospitalRaw[] {
  try {
    const file = path.join(SEED_DIR, '..', 'data', 'seed', 'bangkok_hospitals_gov_all.json');
    const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
    return JSON.parse(raw) as GovHospitalRaw[];
  } catch {
    console.warn('⚠️  Gov hospitals JSON not found — skipping additional hospitals');
    return [];
  }
}

const BKK_CENTER_LAT = 13.7563;
const BKK_CENTER_LNG = 100.5018;
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function slugIdFromName(name: string): string {
  return 'h_' + name.replace(/^โรงพยาบาล/, '').replace(/[\s.,()\/]+/g, '_').slice(0, 50);
}

const DEFAULT_SERVICES: ServiceType[] = ['opd', 'new_patient', 'follow_up'];
const ALL_RIGHTS: InsuranceRight[] = ['uc', 'sso', 'csmbs', 'self_pay'];

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

const CLINICS: ClinicCode[] = ['med', 'surg', 'ped', 'ortho', 'eye', 'ent', 'dent'];

const HOSPITALS = [
  {
    id: 'klang', code: 'รก', name: 'รพ.กลาง', shortName: 'โรงพยาบาลกลาง',
    address: '514 ถ.หลวง เขตป้อมปราบศัตรูพ่าย กรุงเทพฯ 10100', district: 'ป้อมปราบศัตรูพ่าย',
    zone: 'inner', phone: '02-220-8000', openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'new_patient', 'checkup', 'follow_up', 'lab', 'elderly'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'], mockDistanceKm: 2.4,
    description: 'โรงพยาบาลกลางเป็นโรงพยาบาลสังกัดสำนักการแพทย์ กรุงเทพมหานคร ก่อตั้งเมื่อ พ.ศ. 2441 ให้บริการตรวจรักษาผู้ป่วยนอกและผู้ป่วยใน รวมถึงหน่วยฉุกเฉิน 24 ชั่วโมง',
  },
  {
    id: 'taksin', code: 'รต', name: 'รพ.ตากสิน', shortName: 'โรงพยาบาลตากสิน',
    address: '543 ถ.สมเด็จเจ้าพระยา เขตคลองสาน กรุงเทพฯ 10600', district: 'คลองสาน',
    zone: 'thon_north', phone: '02-437-0123', openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'follow_up', 'lab', 'elderly'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 5.1,
    description: 'โรงพยาบาลตากสิน เป็นโรงพยาบาลทั่วไปขนาดใหญ่ของสำนักการแพทย์ กรุงเทพมหานคร ให้บริการตรวจรักษาผู้ป่วยนอก ผู้ป่วยใน และศูนย์ผู้สูงอายุ',
  },
  {
    id: 'charoenkrung', code: 'รจ', name: 'รพ.เจริญกรุงประชารักษ์', shortName: 'โรงพยาบาลเจริญกรุงประชารักษ์',
    address: '8 ซ.เจริญกรุง 93 เขตบางคอแหลม กรุงเทพฯ 10120', district: 'บางคอแหลม',
    zone: 'south', phone: '02-289-7000', openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'checkup', 'follow_up', 'lab'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 6.8,
    description: 'โรงพยาบาลเจริญกรุงประชารักษ์ ให้บริการตรวจรักษาผู้ป่วยนอกและฉุกเฉิน 24 ชั่วโมง พร้อมศูนย์อุบัติเหตุและศูนย์โรคหัวใจ',
  },
  {
    id: 'luangpor', code: 'รล', name: 'รพ.หลวงพ่อทวีศักดิ์', shortName: 'โรงพยาบาลหลวงพ่อทวีศักดิ์ ชุตินฺธโร อุทิศ',
    address: '38 ซ.หลวงพ่อทวีศักดิ์ เขตหนองแขม กรุงเทพฯ 10160', district: 'หนองแขม',
    zone: 'thon_south', phone: '02-429-3576', openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'new_patient', 'follow_up', 'lab'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 12.3,
    description: 'โรงพยาบาลหลวงพ่อทวีศักดิ์ ชุตินฺธโร อุทิศ เป็นโรงพยาบาลขนาดกลางในฝั่งธนบุรี เปิดให้บริการตรวจรักษาทั่วไปและทันตกรรม',
  },
  {
    id: 'rajpipat', code: 'รพ', name: 'รพ.ราชพิพัฒน์', shortName: 'โรงพยาบาลราชพิพัฒน์',
    address: '18 ซ.พุทธมณฑล สาย 3 ซอย 10 เขตบางแค กรุงเทพฯ 10160', district: 'บางแค',
    zone: 'thon_south', phone: '02-444-0163', openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'follow_up', 'lab', 'elderly'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 14.7,
    description: 'โรงพยาบาลราชพิพัฒน์ ให้บริการประชาชนในเขตบางแค หนองแขม และพื้นที่ใกล้เคียง พร้อมศูนย์เวชศาสตร์ครอบครัว',
  },
  {
    id: 'sukhumvit_elderly', code: 'รส', name: 'รพ.ผู้สูงอายุบางขุนเทียน', shortName: 'โรงพยาบาลผู้สูงอายุบางขุนเทียน',
    address: '109 ม.6 ถ.พระราม 2 เขตบางขุนเทียน กรุงเทพฯ 10150', district: 'บางขุนเทียน',
    zone: 'thon_south', phone: '02-405-0555', openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'elderly', 'follow_up', 'medication'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 17.2,
    description: 'โรงพยาบาลผู้สูงอายุบางขุนเทียน เป็นโรงพยาบาลเฉพาะทางสำหรับผู้สูงอายุ มีศูนย์เวชศาสตร์ฟื้นฟูและคลินิกผู้สูงอายุครบวงจร',
  },
  {
    id: 'wetkarunyaras', code: 'รว', name: 'รพ.เวชการุณย์รัศมิ์', shortName: 'โรงพยาบาลเวชการุณย์รัศมิ์',
    address: '48 ม.2 ถ.สังฆสันติสุข เขตหนองจอก กรุงเทพฯ 10530', district: 'หนองจอก',
    zone: 'east', phone: '02-543-2333', openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'follow_up', 'lab', 'new_patient'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 28.9,
    description: 'โรงพยาบาลเวชการุณย์รัศมิ์ ให้บริการประชาชนเขตหนองจอกและพื้นที่รอบนอกฝั่งตะวันออก พร้อมหน่วยเวชศาสตร์ครอบครัว',
  },
  {
    id: 'ladkrabang', code: 'รก', name: 'รพ.ลาดกระบัง', shortName: 'โรงพยาบาลลาดกระบังกรุงเทพมหานคร',
    address: '2 ม.4 ถ.ลาดกระบัง เขตลาดกระบัง กรุงเทพฯ 10520', district: 'ลาดกระบัง',
    zone: 'east', phone: '02-326-7711', openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'checkup', 'follow_up', 'lab'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 22.4,
    description: 'โรงพยาบาลลาดกระบังกรุงเทพมหานคร ให้บริการประชาชนเขตลาดกระบัง พร้อมศูนย์อุบัติเหตุและฉุกเฉิน',
  },
  {
    id: 'sirindhorn', code: 'รส', name: 'รพ.สิรินธร', shortName: 'โรงพยาบาลสิรินธร',
    address: '20 ซ.อ่อนนุช 90 เขตประเวศ กรุงเทพฯ 10250', district: 'ประเวศ',
    zone: 'east', phone: '02-328-6900', openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'checkup', 'follow_up', 'lab', 'elderly'], rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 14.2,
    description: 'โรงพยาบาลสิรินธร ให้บริการตรวจรักษาผู้ป่วยนอกและผู้ป่วยใน พร้อมศูนย์โรคไม่ติดต่อเรื้อรัง (NCD) และคลินิกผู้สูงอายุ',
  },
] as const;

interface SeedReserve {
  bookingCode: string;
  nationalId: string;
  hospitalId: string;
  clinic: ClinicCode;
  purpose: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  queueNumber: string;
  status: string;
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

  // 1b. Additional Bangkok government hospitals.
  const existingShortNames = new Set<string>(HOSPITALS.map((h) => h.shortName));
  let addedGov = 0;
  for (const g of loadGovHospitals()) {
    if (existingShortNames.has(g.name)) continue;
    const id = slugIdFromName(g.name);
    const district = g.dname?.trim() ?? '';
    const distanceKm =
      g.lat != null && g.lng != null
        ? Math.round(haversineKm(BKK_CENTER_LAT, BKK_CENTER_LNG, g.lat, g.lng) * 10) / 10
        : 5.0;
    await prisma.hospital.upsert({
      where: { id },
      update: {},
      create: {
        id, code: 'รพ', name: g.name, shortName: g.name, address: g.address,
        district, zone: zoneForDistrict(district),
        phone: (g.tel ?? '').trim() || '-',
        openingHours: 'จันทร์–ศุกร์ 08:00–16:00',
        description: [g.belong, g.type].filter(Boolean).join(' · ') || 'โรงพยาบาลรัฐในกรุงเทพมหานคร',
        services: DEFAULT_SERVICES, rightsAccepted: ALL_RIGHTS,
        mockDistanceKm: distanceKm,
      },
    });
    addedGov++;
  }
  console.log(`Inserted ${addedGov} additional government hospitals from data.go.th`);

  // 2. Schedules: next 14 weekdays × each clinic × time ranges, capacity 6.
  const base = todayISO();
  const dates: string[] = [];
  for (let i = 0; i < 25 && dates.length < 14; i++) {
    const iso = addDaysISO(base, i);
    if (!isWeekend(iso)) dates.push(iso);
  }

  // Collect all rows first, then insert in chunks to avoid timeout on Railway
  const scheduleRows = HOSPITALS.flatMap((h) =>
    CLINICS.flatMap((clinic) =>
      dates.flatMap((date) =>
        TIME_RANGES.map(([startTime, endTime]) => ({
          hospitalId: h.id, clinic, date, startTime, endTime,
          maxCapacity: 6, currentBooked: 0, isFull: false,
        })),
      ),
    ),
  );

  const CHUNK = 500;
  for (let i = 0; i < scheduleRows.length; i += CHUNK) {
    await prisma.schedule.createMany({
      data: scheduleRows.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    console.log(`  Schedules: ${Math.min(i + CHUNK, scheduleRows.length)}/${scheduleRows.length}`);
  }
  console.log(`✓ ${scheduleRows.length} schedule slots seeded for ${HOSPITALS.length} hospitals`);

  // 3. Demo citizen user.
  const pwd = await bcrypt.hash('care1234', 10);
  const citizen = await prisma.user.upsert({
    where: { nationalId: '1234567890123' },
    update: {},
    create: {
      nationalId: '1234567890123',
      firstName: 'สมพร', lastName: 'ชัยพัฒน์',
      phoneNumber: '0812345678', email: 'somporn@example.com',
      password: pwd, birthDate: '1958-04-12',
      sex: 'female', consentAt: new Date(),
    },
  });

  // 4. Demo reserves (2 upcoming, 3 history).
  const reserves: SeedReserve[] = [
    {
      bookingCode: 'CK-A1001X', nationalId: '1234567890123', hospitalId: 'klang',
      clinic: 'med', purpose: 'follow_up', reason: 'ติดตามอาการความดันสูง',
      date: nextWeekdayFrom(base, 7), startTime: '09:00', endTime: '09:30',
      queueNumber: 'A045', status: 'confirmed',
    },
    {
      bookingCode: 'CK-A1002X', nationalId: '1234567890123', hospitalId: 'klang',
      clinic: 'eye', purpose: 'opd', reason: 'ตรวจสายตา',
      date: nextWeekdayFrom(base, 14), startTime: '13:30', endTime: '14:00',
      queueNumber: 'A012', status: 'pending',
    },
    {
      bookingCode: 'CK-AH1X01', nationalId: '1234567890123', hospitalId: 'klang',
      clinic: 'med', purpose: 'follow_up', reason: 'ติดตามความดัน',
      date: addDaysISO(base, -14), startTime: '08:30', endTime: '09:00',
      queueNumber: 'A012', status: 'completed',
    },
    {
      bookingCode: 'CK-AH2X02', nationalId: '1234567890123', hospitalId: 'klang',
      clinic: 'dent', purpose: 'opd', reason: 'ขูดหินปูน',
      date: addDaysISO(base, -28), startTime: '10:00', endTime: '10:30',
      queueNumber: 'A034', status: 'completed',
    },
    {
      bookingCode: 'CK-AH3X03', nationalId: '1234567890123', hospitalId: 'klang',
      clinic: 'eye', purpose: 'opd', reason: 'ตรวจสายตา',
      date: addDaysISO(base, -55), startTime: '14:00', endTime: '14:30',
      queueNumber: 'A018', status: 'no_show',
    },
  ];

  for (const r of reserves) {
    const schedule = await prisma.schedule.upsert({
      where: { slot_identity: { hospitalId: r.hospitalId, clinic: r.clinic as ClinicCode, date: r.date, startTime: r.startTime } },
      update: {},
      create: {
        hospitalId: r.hospitalId, clinic: r.clinic as ClinicCode,
        date: r.date, startTime: r.startTime, endTime: r.endTime,
        maxCapacity: 6, currentBooked: 0,
      },
    });
    await prisma.reserve.upsert({
      where: { bookingCode: r.bookingCode },
      update: {},
      create: {
        bookingCode: r.bookingCode, userId: citizen.id,
        hospitalId: r.hospitalId, scheduleId: schedule.id,
        purpose: r.purpose as never, reason: r.reason,
        status: r.status as never, queueNumber: r.queueNumber,
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
