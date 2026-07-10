import type { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter.js';

/**
 * การตั้งค่า app ทั้งหมดรวมไว้ที่เดียว — main.ts และ test bootstrap ต้องเรียก
 * ฟังก์ชันนี้ร่วมกัน ไม่งั้นเทสต์ผ่านแต่ prod พัง (หรือกลับกัน)
 *
 * ⚠️ contract เดิม:
 *  - CORS: origin: true + credentials (เหมือน cors() ตัวเดิมใน app.ts)
 *  - global prefix 'api' ยกเว้น /line/* (LINE webhook ไม่มี prefix)
 */
export function configureApp(app: INestApplication): void {
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api', { exclude: ['line/webhook'] });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
