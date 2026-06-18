import type { Zone } from '@prisma/client';

export const DISTRICT_TO_ZONE: Record<string, Zone> = {
  'พระนคร': 'inner',
  'ดุสิต': 'inner',
  'ป้อมปราบศัตรูพ่าย': 'inner',
  'สัมพันธวงศ์': 'inner',
  'ดินแดง': 'inner',
  'ห้วยขวาง': 'inner',
  'พญาไท': 'inner',
  'ราชเทวี': 'inner',
  'วังทองหลาง': 'inner',

  'จตุจักร': 'north',
  'บางซื่อ': 'north',
  'ลาดพร้าว': 'north',
  'หลักสี่': 'north',
  'ดอนเมือง': 'north',
  'สายไหม': 'north',
  'บางเขน': 'north',

  'สาทร': 'south',
  'บางรัก': 'south',
  'บางคอแหลม': 'south',
  'ยานนาวา': 'south',
  'คลองเตย': 'south',
  'วัฒนา': 'south',
  'ปทุมวัน': 'south',
  'พระโขนง': 'south',
  'สวนหลวง': 'south',
  'บางนา': 'south',

  'ลาดกระบัง': 'east',
  'มีนบุรี': 'east',
  'หนองจอก': 'east',
  'คลองสามวา': 'east',
  'สะพานสูง': 'east',
  'ประเวศ': 'east',
  'บางกะปิ': 'east',
  'บึงกุ่ม': 'east',
  'คันนายาว': 'east',

  'ธนบุรี': 'thon_north',
  'คลองสาน': 'thon_north',
  'จอมทอง': 'thon_north',
  'บางกอกใหญ่': 'thon_north',
  'บางกอกน้อย': 'thon_north',
  'บางพลัด': 'thon_north',
  'ตลิ่งชัน': 'thon_north',
  'ทวีวัฒนา': 'thon_north',

  'ภาษีเจริญ': 'thon_south',
  'หนองแขม': 'thon_south',
  'บางแค': 'thon_south',
  'บางขุนเทียน': 'thon_south',
  'บางบอน': 'thon_south',
  'ทุ่งครุ': 'thon_south',
  'ราษฎร์บูรณะ': 'thon_south',
};

export function zoneForDistrict(district: string | null | undefined): Zone {
  if (!district) return 'inner';
  const trimmed = district.trim();
  return DISTRICT_TO_ZONE[trimmed] ?? 'inner';
}
