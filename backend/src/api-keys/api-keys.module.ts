import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ApiKeysController } from './api-keys.controller.js';
import { SheetsService } from './sheets.service.js';

@Module({
  imports: [AuthModule], // JwtAuthGuard ต้องใช้ AuthService.verifyToken
  controllers: [ApiKeysController],
  providers: [SheetsService],
})
export class ApiKeysModule {}
