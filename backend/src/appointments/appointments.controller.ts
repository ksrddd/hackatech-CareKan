import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  MyAppointmentsResponse,
} from '../../../shared/api';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard, type RequestUser } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createAppointmentSchema } from '../validation/schemas.js';
import { AppointmentsService } from './appointments.service.js';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createAppointmentSchema)) body: CreateAppointmentRequest,
  ): Promise<AppointmentResponse> {
    return { appointment: await this.appointments.createAppointment(user.id, body) };
  }

  // ⚠️ 'me' ต้องประกาศก่อน ':id' — ไม่งั้น /appointments/me ถูกจับเป็น id="me"
  @Get('me')
  mine(@CurrentUser() user: RequestUser): Promise<MyAppointmentsResponse> {
    return this.appointments.getMyAppointments(user.id);
  }

  @Get(':id')
  async detail(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<AppointmentResponse> {
    return { appointment: await this.appointments.getAppointmentForOwner(id, user.id) };
  }
}

/** QR check — public โดยตั้งใจ: เจ้าหน้าที่สแกนโดยไม่ต้อง login (contract เดิม) */
@Controller('scanned')
export class ScannedController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get(':id')
  async qrCheck(@Param('id') id: string): Promise<AppointmentResponse> {
    return { appointment: await this.appointments.getQrAppointment(id) };
  }
}
