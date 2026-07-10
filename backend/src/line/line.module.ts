import { Module, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LineController } from './line.controller.js';
import { LineSignatureGuard } from './line-signature.guard.js';

@Module({
  controllers: [LineController],
  providers: [LineSignatureGuard],
})
export class LineModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (!this.config.get<string>('LINE_CHANNEL_SECRET')) {
      // ตั้งใจให้ boot ได้โดยไม่มี LINE creds (dev/test) — webhook จะตอบ 401 จนกว่าจะตั้งค่า
      console.warn('[line] LINE_CHANNEL_SECRET not set — webhook will reject all requests');
    }
  }
}
