import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AppointmentsController, ScannedController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';

@Module({
  imports: [AuthModule], // JwtAuthGuard ต้องใช้ AuthService.verifyToken
  controllers: [AppointmentsController, ScannedController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
