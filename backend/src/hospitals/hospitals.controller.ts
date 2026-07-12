import { Controller, Get, Param, Query } from '@nestjs/common';
import type {
  HospitalDetailResponse,
  HospitalsQuery,
  HospitalsResponse,
  TimeSlotsResponse,
} from '../../../shared/api';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { hospitalsQuerySchema, timeSlotsQuerySchema } from '../validation/schemas.js';
import { HospitalsService } from './hospitals.service.js';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitals: HospitalsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(hospitalsQuerySchema)) q: HospitalsQuery,
  ): Promise<HospitalsResponse> {
    return { hospitals: await this.hospitals.listHospitals(q) };
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<HospitalDetailResponse> {
    return this.hospitals.getHospitalDetail(id);
  }

  @Get(':id/time-slots')
  async timeSlots(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(timeSlotsQuerySchema)) q: { date: string },
  ): Promise<TimeSlotsResponse> {
    return { slots: await this.hospitals.listTimeSlots(id, q.date) };
  }
}
