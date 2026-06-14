const THAI_MONTHS_LONG = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_DAYS_LONG = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function parseISODate(iso: string): Date {
  const [datePart, timePart] = iso.split('T');
  if (timePart) return new Date(iso);
  const parts = (datePart ?? iso).split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d);
}

export function buddhistYear(d: Date): number {
  return d.getFullYear() + 543;
}

export function formatBuddhistDate(iso: string): string {
  const d = parseISODate(iso);
  const day = THAI_DAYS_LONG[d.getDay()];
  const month = THAI_MONTHS_LONG[d.getMonth()];
  return `${day}ที่ ${d.getDate()} ${month} ${buddhistYear(d)}`;
}

export function formatBuddhistDateShort(iso: string): string {
  const d = parseISODate(iso);
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  return `${d.getDate()} ${month} ${buddhistYear(d)}`;
}

export function formatThaiWeekdayShort(iso: string): string {
  const d = parseISODate(iso);
  return THAI_DAYS_SHORT[d.getDay()] ?? '';
}

export function formatThaiWeekday(iso: string): string {
  const d = parseISODate(iso);
  return THAI_DAYS_LONG[d.getDay()] ?? '';
}

export function formatTime(t: string): string {
  return `${t} น.`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end} น.`;
}

export function maskNationalId(id: string): string {
  if (id.length !== 13) return id;
  const last4 = id.slice(-4);
  return `x-xxxx-xxxxx-${last4.slice(0, 2)}-${last4.slice(2)}`;
}

export function ageFromBirth(iso: string): number {
  const d = parseISODate(iso);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isPastDate(iso: string): boolean {
  const d = parseISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isWeekend(iso: string): boolean {
  const day = parseISODate(iso).getDay();
  return day === 0 || day === 6;
}

export function nowFormatted(): string {
  const d = new Date();
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${buddhistYear(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
}
