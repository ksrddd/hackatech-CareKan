// Pure presentational content — not part of the API contract.
export const ANNOUNCEMENTS = {
  loginNotice:
    'วันที่ 12–14 ก.ค. ระบบจะปิดปรับปรุงระหว่างเวลา 23:00–02:00 น. ผู้รับบริการสามารถจองคิวล่วงหน้านอกช่วงเวลาดังกล่าวได้ตามปกติ',
};

export interface ConsultRoom { number: string; doctor: string; status: 'in_use' | 'available' | 'closed'; }
export const CONSULT_ROOMS: ConsultRoom[] = [
  { number: '207', doctor: 'พญ.สุภาวดี', status: 'in_use' },
  { number: '208', doctor: 'นพ.วิทยา', status: 'in_use' },
  { number: '209', doctor: 'พญ.พัชราภา', status: 'available' },
  { number: '210', doctor: 'ปิดเช้านี้', status: 'closed' },
];

export const ADMIN_HOURLY_LOAD = [
  { hour: '07:00', booked: 20, capacity: 20 }, { hour: '08:00', booked: 18, capacity: 20 },
  { hour: '09:00', booked: 17, capacity: 20, current: true }, { hour: '10:00', booked: 12, capacity: 20 },
  { hour: '11:00', booked: 8, capacity: 20 }, { hour: '13:00', booked: 4, capacity: 20 },
  { hour: '14:00', booked: 6, capacity: 20 }, { hour: '15:00', booked: 2, capacity: 20 },
];
