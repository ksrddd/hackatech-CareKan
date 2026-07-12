// Load test environment variables before any module is initialized.
// This must run before PrismaService is created, so that the test DB
// (carekan_test) is used instead of the dev DB.
import { config } from 'dotenv';
config({ path: '.env.test', override: true });

// เทสต์เรียก resetDb() ที่ล้างทุกตาราง — ห้ามชี้ DB ที่ไม่ใช่ local เด็ดขาด
// (กันเผลอ copy Supabase URL ลง .env.test แล้วข้อมูล dev/prod หายทั้งก้อน)
const url = process.env.DATABASE_URL ?? '';
if (!/localhost|127\.0\.0\.1/.test(url)) {
  throw new Error(
    `Refusing to run tests against a non-local database: ${url.replace(/:[^:@/]+@/, ':***@')}`,
  );
}
