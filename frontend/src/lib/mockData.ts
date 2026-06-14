import { addDaysISO, todayISO } from './format';
import type {
  Appointment,
  ClinicCode,
  Hospital,
  TimeSlot,
  User,
} from './types';

export const HOSPITALS: Hospital[] = [
  {
    id: 'klang',
    code: 'รก',
    name: 'รพ.กลาง',
    shortName: 'โรงพยาบาลกลาง',
    address: '514 ถ.หลวง เขตป้อมปราบศัตรูพ่าย กรุงเทพฯ 10100',
    district: 'ป้อมปราบศัตรูพ่าย',
    zone: 'inner',
    phone: '02-220-8000',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'new_patient', 'checkup', 'follow_up', 'lab', 'elderly'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 2.4,
    description:
      'โรงพยาบาลกลางเป็นโรงพยาบาลสังกัดสำนักการแพทย์ กรุงเทพมหานคร ก่อตั้งเมื่อ พ.ศ. 2441 ให้บริการตรวจรักษาผู้ป่วยนอกและผู้ป่วยใน รวมถึงหน่วยฉุกเฉิน 24 ชั่วโมง',
  },
  {
    id: 'taksin',
    code: 'รต',
    name: 'รพ.ตากสิน',
    shortName: 'โรงพยาบาลตากสิน',
    address: '543 ถ.สมเด็จเจ้าพระยา เขตคลองสาน กรุงเทพฯ 10600',
    district: 'คลองสาน',
    zone: 'thon_north',
    phone: '02-437-0123',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'follow_up', 'lab', 'elderly'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 5.1,
    description:
      'โรงพยาบาลตากสิน เป็นโรงพยาบาลทั่วไปขนาดใหญ่ของสำนักการแพทย์ กรุงเทพมหานคร ให้บริการตรวจรักษาผู้ป่วยนอก ผู้ป่วยใน และศูนย์ผู้สูงอายุ',
  },
  {
    id: 'charoenkrung',
    code: 'รจ',
    name: 'รพ.เจริญกรุงประชารักษ์',
    shortName: 'โรงพยาบาลเจริญกรุงประชารักษ์',
    address: '8 ซ.เจริญกรุง 93 เขตบางคอแหลม กรุงเทพฯ 10120',
    district: 'บางคอแหลม',
    zone: 'south',
    phone: '02-289-7000',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'checkup', 'follow_up', 'lab'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 6.8,
    description:
      'โรงพยาบาลเจริญกรุงประชารักษ์ ให้บริการตรวจรักษาผู้ป่วยนอกและฉุกเฉิน 24 ชั่วโมง พร้อมศูนย์อุบัติเหตุและศูนย์โรคหัวใจ',
  },
  {
    id: 'luangpor',
    code: 'รล',
    name: 'รพ.หลวงพ่อทวีศักดิ์',
    shortName: 'โรงพยาบาลหลวงพ่อทวีศักดิ์ ชุตินฺธโร อุทิศ',
    address: '38 ซ.หลวงพ่อทวีศักดิ์ เขตหนองแขม กรุงเทพฯ 10160',
    district: 'หนองแขม',
    zone: 'thon_south',
    phone: '02-429-3576',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'new_patient', 'follow_up', 'lab'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 12.3,
    description:
      'โรงพยาบาลหลวงพ่อทวีศักดิ์ ชุตินฺธโร อุทิศ เป็นโรงพยาบาลขนาดกลางในฝั่งธนบุรี เปิดให้บริการตรวจรักษาทั่วไปและทันตกรรม',
  },
  {
    id: 'rajpipat',
    code: 'รพ',
    name: 'รพ.ราชพิพัฒน์',
    shortName: 'โรงพยาบาลราชพิพัฒน์',
    address: '18 ซ.พุทธมณฑล สาย 3 ซอย 10 เขตบางแค กรุงเทพฯ 10160',
    district: 'บางแค',
    zone: 'thon_south',
    phone: '02-444-0163',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'follow_up', 'lab', 'elderly'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 14.7,
    description:
      'โรงพยาบาลราชพิพัฒน์ ให้บริการประชาชนในเขตบางแค หนองแขม และพื้นที่ใกล้เคียง พร้อมศูนย์เวชศาสตร์ครอบครัว',
  },
  {
    id: 'sukhumvit_elderly',
    code: 'รส',
    name: 'รพ.ผู้สูงอายุบางขุนเทียน',
    shortName: 'โรงพยาบาลผู้สูงอายุบางขุนเทียน',
    address: '109 ม.6 ถ.พระราม 2 เขตบางขุนเทียน กรุงเทพฯ 10150',
    district: 'บางขุนเทียน',
    zone: 'thon_south',
    phone: '02-405-0555',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'elderly', 'follow_up', 'medication'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 17.2,
    description:
      'โรงพยาบาลผู้สูงอายุบางขุนเทียน เป็นโรงพยาบาลเฉพาะทางสำหรับผู้สูงอายุ มีศูนย์เวชศาสตร์ฟื้นฟูและคลินิกผู้สูงอายุครบวงจร',
  },
  {
    id: 'wetkarunyaras',
    code: 'รว',
    name: 'รพ.เวชการุณย์รัศมิ์',
    shortName: 'โรงพยาบาลเวชการุณย์รัศมิ์',
    address: '48 ม.2 ถ.สังฆสันติสุข เขตหนองจอก กรุงเทพฯ 10530',
    district: 'หนองจอก',
    zone: 'east',
    phone: '02-543-2333',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00',
    services: ['opd', 'follow_up', 'lab', 'new_patient'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 28.9,
    description:
      'โรงพยาบาลเวชการุณย์รัศมิ์ ให้บริการประชาชนเขตหนองจอกและพื้นที่รอบนอกฝั่งตะวันออก พร้อมหน่วยเวชศาสตร์ครอบครัว',
  },
  {
    id: 'ladkrabang',
    code: 'รก',
    name: 'รพ.ลาดกระบัง',
    shortName: 'โรงพยาบาลลาดกระบังกรุงเทพมหานคร',
    address: '2 ม.4 ถ.ลาดกระบัง เขตลาดกระบัง กรุงเทพฯ 10520',
    district: 'ลาดกระบัง',
    zone: 'east',
    phone: '02-326-7711',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'checkup', 'follow_up', 'lab'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 22.4,
    description:
      'โรงพยาบาลลาดกระบังกรุงเทพมหานคร ให้บริการประชาชนเขตลาดกระบัง พร้อมศูนย์อุบัติเหตุและฉุกเฉิน',
  },
  {
    id: 'sirindhorn',
    code: 'รส',
    name: 'รพ.สิรินธร',
    shortName: 'โรงพยาบาลสิรินธร',
    address: '20 ซ.อ่อนนุช 90 เขตประเวศ กรุงเทพฯ 10250',
    district: 'ประเวศ',
    zone: 'east',
    phone: '02-328-6900',
    openingHours: 'จันทร์–ศุกร์ 07:00–16:00 · เสาร์ 07:00–12:00',
    services: ['opd', 'checkup', 'follow_up', 'lab', 'elderly'],
    rightsAccepted: ['uc', 'sso', 'csmbs', 'self_pay'],
    mockDistanceKm: 14.2,
    description:
      'โรงพยาบาลสิรินธร ให้บริการตรวจรักษาผู้ป่วยนอกและผู้ป่วยใน พร้อมศูนย์โรคไม่ติดต่อเรื้อรัง (NCD) และคลินิกผู้สูงอายุ',
  },
];

export const HOSPITAL_CLINICS: Record<string, ClinicCode[]> = {
  klang: ['med', 'surg', 'ped', 'ob', 'ortho', 'eye', 'ent', 'dent', 'ncd'],
  taksin: ['med', 'surg', 'ped', 'ortho', 'eye', 'dent', 'ncd'],
  charoenkrung: ['med', 'surg', 'ortho', 'eye', 'ent', 'skin', 'ncd'],
  luangpor: ['med', 'ped', 'dent', 'ncd'],
  rajpipat: ['med', 'ortho', 'ncd', 'dent'],
  sukhumvit_elderly: ['med', 'ortho', 'ncd', 'psych'],
  wetkarunyaras: ['med', 'ped', 'ob', 'dent'],
  ladkrabang: ['med', 'surg', 'ortho', 'dent', 'ncd'],
  sirindhorn: ['med', 'surg', 'ped', 'eye', 'ent', 'ncd'],
};

export const MOCK_USERS: User[] = [
  {
    id: 'u-1',
    fullName: 'สมพร ชัยพัฒน์',
    nationalId: '1234567890123',
    birthDate: '1963-03-14',
    sex: 'female',
    phone: '081-234-9842',
    email: 'somporn@example.com',
    role: 'citizen',
    insuranceRight: 'uc',
    primaryHospitalId: 'klang',
    hospitalPatientId: '03-65-12345',
    consentAt: '2025-05-12T09:14:00Z',
    createdAt: '2025-05-12T09:14:00Z',
  },
  {
    id: 'u-2',
    fullName: 'พญ.สุภาวดี แก้วใส',
    nationalId: '9876543210987',
    birthDate: '1980-09-21',
    sex: 'female',
    phone: '02-220-8000',
    email: 'supawadee@klanghospital.go.th',
    role: 'admin',
    insuranceRight: 'csmbs',
    primaryHospitalId: 'klang',
    hospitalPatientId: null,
    consentAt: '2025-05-12T09:14:00Z',
    createdAt: '2025-04-01T08:00:00Z',
  },
];

const MORNING_TIMES = [
  ['08:00', '08:30'],
  ['08:30', '09:00'],
  ['09:00', '09:30'],
  ['09:30', '10:00'],
  ['10:00', '10:30'],
  ['10:30', '11:00'],
  ['11:00', '11:30'],
  ['11:30', '12:00'],
] as const;

const AFTERNOON_TIMES = [
  ['13:00', '13:30'],
  ['13:30', '14:00'],
  ['14:00', '14:30'],
  ['14:30', '15:00'],
  ['15:00', '15:30'],
  ['15:30', '16:00'],
] as const;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateSlots(
  hospitalId: string,
  clinic: ClinicCode,
  date: string,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const ranges = [...MORNING_TIMES, ...AFTERNOON_TIMES];
  ranges.forEach(([start, end], i) => {
    const key = `${hospitalId}-${clinic}-${date}-${start}`;
    const h = hash(key);
    const capacity = 6;
    const booked = h % (capacity + 1);
    slots.push({
      id: key,
      hospitalId,
      clinic,
      date,
      startTime: start,
      endTime: end,
      capacity,
      booked: Math.min(capacity, booked + (i === 0 || i === 1 ? 4 : 0)),
    });
  });
  return slots;
}

export function getDayAvailability(
  hospitalId: string,
  clinic: ClinicCode,
  date: string,
): { totalCapacity: number; totalBooked: number; remaining: number } {
  const slots = generateSlots(hospitalId, clinic, date);
  const totalCapacity = slots.reduce((s, x) => s + x.capacity, 0);
  const totalBooked = slots.reduce((s, x) => s + x.booked, 0);
  return {
    totalCapacity,
    totalBooked,
    remaining: totalCapacity - totalBooked,
  };
}

function makeRef(seed: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const h = hash(seed);
  let out = '';
  let n = h;
  for (let i = 0; i < 6; i++) {
    out += chars[n % chars.length];
    n = Math.floor(n / chars.length) + 17;
  }
  return `CK-${out}`;
}

function nextWeekdayFrom(base: string, dayOffset: number): string {
  let iso = addDaysISO(base, dayOffset);
  const d = new Date(iso);
  while (d.getDay() === 0 || d.getDay() === 6) {
    iso = addDaysISO(iso, 1);
    d.setDate(d.getDate() + 1);
  }
  return iso;
}

const today = todayISO();
const sevenFromNow = nextWeekdayFrom(today, 7);
const fourteenFromNow = nextWeekdayFrom(today, 14);

const past1 = addDaysISO(today, -14);
const past2 = addDaysISO(today, -28);
const past3 = addDaysISO(today, -55);

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a-1001',
    bookingRef: makeRef('a-1001'),
    userId: 'u-1',
    userFullName: 'สมพร ชัยพัฒน์',
    hospitalId: 'klang',
    clinic: 'med',
    purpose: 'follow_up',
    reason: 'ติดตามอาการความดันสูง · ผลเลือดจากนัดที่แล้ว',
    date: sevenFromNow,
    startTime: '09:00',
    endTime: '09:30',
    queueNumber: 'A045',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -10) + 'T14:25:00Z',
  },
  {
    id: 'a-1002',
    bookingRef: makeRef('a-1002'),
    userId: 'u-1',
    userFullName: 'สมพร ชัยพัฒน์',
    hospitalId: 'sirindhorn',
    clinic: 'eye',
    purpose: 'opd',
    reason: 'ตรวจสายตา',
    date: fourteenFromNow,
    startTime: '13:30',
    endTime: '14:00',
    queueNumber: 'O012',
    status: 'pending',
    checkedInAt: null,
    createdAt: addDaysISO(today, -3) + 'T10:11:00Z',
  },
  {
    id: 'a-h1',
    bookingRef: makeRef('a-h1'),
    userId: 'u-1',
    userFullName: 'สมพร ชัยพัฒน์',
    hospitalId: 'klang',
    clinic: 'med',
    purpose: 'follow_up',
    reason: 'ติดตามความดัน',
    date: past1,
    startTime: '08:30',
    endTime: '09:00',
    queueNumber: 'A012',
    status: 'completed',
    checkedInAt: past1 + 'T08:05:00Z',
    createdAt: past1 + 'T08:05:00Z',
  },
  {
    id: 'a-h2',
    bookingRef: makeRef('a-h2'),
    userId: 'u-1',
    userFullName: 'สมพร ชัยพัฒน์',
    hospitalId: 'taksin',
    clinic: 'dent',
    purpose: 'opd',
    reason: 'ขูดหินปูน',
    date: past2,
    startTime: '10:00',
    endTime: '10:30',
    queueNumber: 'D034',
    status: 'completed',
    checkedInAt: past2 + 'T09:50:00Z',
    createdAt: past2 + 'T09:50:00Z',
  },
  {
    id: 'a-h3',
    bookingRef: makeRef('a-h3'),
    userId: 'u-1',
    userFullName: 'สมพร ชัยพัฒน์',
    hospitalId: 'sirindhorn',
    clinic: 'eye',
    purpose: 'opd',
    reason: 'ตรวจสายตา',
    date: past3,
    startTime: '14:00',
    endTime: '14:30',
    queueNumber: 'O018',
    status: 'no_show',
    checkedInAt: null,
    createdAt: past3 + 'T14:00:00Z',
  },
];

const ADMIN_QUEUE_TODAY_KLANG_MED: Omit<Appointment, 'date' | 'hospitalId' | 'clinic'>[] = [
  {
    id: 'q-038',
    bookingRef: 'CK-PR8K1A',
    userId: 'q-u-1',
    userFullName: 'นายประพันธ์ ก.',
    purpose: 'follow_up',
    reason: 'เบาหวาน ติดตามผลเลือด',
    startTime: '08:30',
    endTime: '09:00',
    queueNumber: 'A038',
    status: 'in_progress',
    checkedInAt: today + 'T07:58:00Z',
    createdAt: addDaysISO(today, -7) + 'T09:00:00Z',
  },
  {
    id: 'q-039',
    bookingRef: 'CK-JT2M4N',
    userId: 'q-u-2',
    userFullName: 'น.ส.จินตนา ม.',
    purpose: 'follow_up',
    reason: 'ความดันสูง',
    startTime: '08:30',
    endTime: '09:00',
    queueNumber: 'A039',
    status: 'checked_in',
    checkedInAt: today + 'T08:05:00Z',
    createdAt: addDaysISO(today, -7) + 'T10:00:00Z',
  },
  {
    id: 'q-040',
    bookingRef: 'CK-LK7H3D',
    userId: 'q-u-3',
    userFullName: 'นายสมหมาย ท.',
    purpose: 'checkup',
    reason: 'ตรวจสุขภาพประจำปี',
    startTime: '08:30',
    endTime: '09:00',
    queueNumber: 'A040',
    status: 'checked_in',
    checkedInAt: today + 'T08:14:00Z',
    createdAt: addDaysISO(today, -7) + 'T11:30:00Z',
  },
  {
    id: 'q-041',
    bookingRef: 'CK-PL5N9Q',
    userId: 'q-u-4',
    userFullName: 'นางพิน ล.',
    purpose: 'follow_up',
    reason: 'ปวดข้อเรื้อรัง',
    startTime: '08:30',
    endTime: '09:00',
    queueNumber: 'A041',
    status: 'no_show',
    checkedInAt: null,
    createdAt: addDaysISO(today, -10) + 'T13:00:00Z',
  },
  {
    id: 'q-042',
    bookingRef: 'CK-TR3W8P',
    userId: 'q-u-5',
    userFullName: 'นายธีรพงษ์ ส.',
    purpose: 'follow_up',
    reason: 'โรคไต ติดตาม creatinine',
    startTime: '09:00',
    endTime: '09:30',
    queueNumber: 'A042',
    status: 'checked_in',
    checkedInAt: today + 'T08:31:00Z',
    createdAt: addDaysISO(today, -7) + 'T08:00:00Z',
  },
  {
    id: 'q-043',
    bookingRef: 'CK-ML4K6X',
    userId: 'q-u-6',
    userFullName: 'นางมาลี ภ.',
    purpose: 'opd',
    reason: 'อาการเหนื่อยง่าย',
    startTime: '09:00',
    endTime: '09:30',
    queueNumber: 'A043',
    status: 'checked_in',
    checkedInAt: today + 'T08:35:00Z',
    createdAt: addDaysISO(today, -5) + 'T11:00:00Z',
  },
  {
    id: 'q-044',
    bookingRef: 'CK-AM2K7T',
    userId: 'q-u-7',
    userFullName: 'นายอำนาจ ว.',
    purpose: 'follow_up',
    reason: 'นัดต่อเนื่อง',
    startTime: '09:00',
    endTime: '09:30',
    queueNumber: 'A044',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -14) + 'T14:00:00Z',
  },
  {
    id: 'q-045',
    bookingRef: 'CK-SP1K8Z',
    userId: 'u-1',
    userFullName: 'นางสมพร ช.',
    purpose: 'follow_up',
    reason: 'ความดันสูง ติดตาม',
    startTime: '09:00',
    endTime: '09:30',
    queueNumber: 'A045',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -10) + 'T14:25:00Z',
  },
  {
    id: 'q-046',
    bookingRef: 'CK-CW6N3V',
    userId: 'q-u-9',
    userFullName: 'นายชัยวัฒน์ ก.',
    purpose: 'follow_up',
    reason: 'นัดต่อเนื่อง',
    startTime: '09:30',
    endTime: '10:00',
    queueNumber: 'A046',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -9) + 'T16:00:00Z',
  },
  {
    id: 'q-047',
    bookingRef: 'CK-SD9N2L',
    userId: 'q-u-10',
    userFullName: 'นางสุดา ป.',
    purpose: 'follow_up',
    reason: 'โรคหัวใจ ติดตาม',
    startTime: '09:30',
    endTime: '10:00',
    queueNumber: 'A047',
    status: 'checked_in',
    checkedInAt: today + 'T08:40:00Z',
    createdAt: addDaysISO(today, -7) + 'T09:00:00Z',
  },
  {
    id: 'q-048',
    bookingRef: 'CK-VK4M9X',
    userId: 'q-u-11',
    userFullName: 'นายวีระ ค.',
    purpose: 'opd',
    reason: 'ปวดท้อง',
    startTime: '10:00',
    endTime: '10:30',
    queueNumber: 'A048',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -3) + 'T10:30:00Z',
  },
  {
    id: 'q-049',
    bookingRef: 'CK-NK7L2D',
    userId: 'q-u-12',
    userFullName: 'นางนภา ร.',
    purpose: 'medication',
    reason: 'รับยาเรื้อรัง',
    startTime: '10:00',
    endTime: '10:30',
    queueNumber: 'A049',
    status: 'confirmed',
    checkedInAt: null,
    createdAt: addDaysISO(today, -14) + 'T08:00:00Z',
  },
];

export const ADMIN_QUEUE_TODAY: Appointment[] = ADMIN_QUEUE_TODAY_KLANG_MED.map(
  (a) => ({
    ...a,
    hospitalId: 'klang',
    clinic: 'med',
    date: today,
  }),
);

function requireAt<T>(arr: readonly T[], index: number, name: string): T {
  const value = arr[index];
  if (value === undefined) {
    throw new Error(`Invariant violated: ${name}[${index}] is undefined`);
  }
  return value;
}

export const ADMIN_RECENT_BOOKINGS: { time: string; appt: Appointment }[] = [
  { time: '06:42', appt: requireAt(ADMIN_QUEUE_TODAY, 7, 'ADMIN_QUEUE_TODAY') },
  { time: '06:31', appt: requireAt(ADMIN_QUEUE_TODAY, 6, 'ADMIN_QUEUE_TODAY') },
  { time: '06:22', appt: requireAt(ADMIN_QUEUE_TODAY, 2, 'ADMIN_QUEUE_TODAY') },
  { time: '05:58', appt: requireAt(ADMIN_QUEUE_TODAY, 1, 'ADMIN_QUEUE_TODAY') },
  { time: '05:30', appt: requireAt(ADMIN_QUEUE_TODAY, 0, 'ADMIN_QUEUE_TODAY') },
];

export const DEFAULT_HOSPITAL: Hospital = requireAt(HOSPITALS, 0, 'HOSPITALS');

export const ADMIN_HOURLY_LOAD = [
  { hour: '07:00', booked: 20, capacity: 20 },
  { hour: '08:00', booked: 18, capacity: 20 },
  { hour: '09:00', booked: 17, capacity: 20, current: true },
  { hour: '10:00', booked: 12, capacity: 20 },
  { hour: '11:00', booked: 8, capacity: 20 },
  { hour: '13:00', booked: 4, capacity: 20 },
  { hour: '14:00', booked: 6, capacity: 20 },
  { hour: '15:00', booked: 2, capacity: 20 },
];

export interface ConsultRoom {
  number: string;
  doctor: string;
  status: 'in_use' | 'available' | 'closed';
}

export const CONSULT_ROOMS: ConsultRoom[] = [
  { number: '207', doctor: 'พญ.สุภาวดี', status: 'in_use' },
  { number: '208', doctor: 'นพ.วิทยา', status: 'in_use' },
  { number: '209', doctor: 'พญ.พัชราภา', status: 'available' },
  { number: '210', doctor: 'ปิดเช้านี้', status: 'closed' },
];

export const ANNOUNCEMENTS = {
  loginNotice:
    'วันที่ 12–14 ก.ค. ระบบจะปิดปรับปรุงระหว่างเวลา 23:00–02:00 น. ผู้รับบริการสามารถจองคิวล่วงหน้านอกช่วงเวลาดังกล่าวได้ตามปกติ',
};

export function getHospital(id: string): Hospital | undefined {
  return HOSPITALS.find((h) => h.id === id);
}

export function getUserAppointments(userId: string): Appointment[] {
  return MOCK_APPOINTMENTS.filter((a) => a.userId === userId);
}

export function getAppointment(id: string): Appointment | undefined {
  return [...MOCK_APPOINTMENTS, ...ADMIN_QUEUE_TODAY].find((a) => a.id === id);
}
