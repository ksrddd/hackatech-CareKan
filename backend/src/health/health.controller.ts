import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { ok: boolean; service: string; version: string } {
    return { ok: true, service: 'carekan-backend', version: '1.0.0' };
  }
}
