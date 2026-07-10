import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AppointmentResponse } from '../../../shared/api';
import { HospitalKey } from '../common/decorators/hospital-key.decorator.js';
import { HospitalKeyGuard } from '../common/guards/hospital-key.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedHospitalKey } from './hospital-key.service.js';
import {
  createHospitalReserveSchema,
  reserveStatusSchema,
  type CreateHospitalReserveInput,
} from './hospital-reserve.schemas.js';
import { HospitalReserveService } from './hospital-reserve.service.js';

@Controller('hospital/reserves')
@UseGuards(HospitalKeyGuard)
export class HospitalReserveController {
  constructor(private readonly reserves: HospitalReserveService) {}

  @Post()
  async createReserve(
    @HospitalKey() key: AuthenticatedHospitalKey,
    @Body(new ZodValidationPipe(createHospitalReserveSchema)) body: CreateHospitalReserveInput,
  ): Promise<AppointmentResponse> {
    return { appointment: await this.reserves.createReserve(key, body) };
  }

  @Patch(':id/status')
  async updateReserveStatus(
    @HospitalKey() key: AuthenticatedHospitalKey,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reserveStatusSchema)) body: { status: 'completed' | 'cancelled' },
  ): Promise<AppointmentResponse> {
    return { appointment: await this.reserves.updateReserveStatus(key, id, body.status) };
  }
}
