import type { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Parse ด้วย Zod schema เดิม — โยน ZodError ให้ AllExceptionsFilter แปลงเป็น
 *  { error: 'ข้อมูลไม่ถูกต้อง', code: 'VALIDATION', details } เหมือน backend เก่า */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    return this.schema.parse(value);
  }
}
