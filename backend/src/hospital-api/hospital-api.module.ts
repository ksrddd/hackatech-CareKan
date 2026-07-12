import { Module } from '@nestjs/common';
import { HospitalKeyService } from './hospital-key.service.js';
import { HospitalReserveController } from './hospital-reserve.controller.js';
import { HospitalReserveService } from './hospital-reserve.service.js';

@Module({
  controllers: [HospitalReserveController],
  providers: [HospitalKeyService, HospitalReserveService],
})
export class HospitalApiModule {}
