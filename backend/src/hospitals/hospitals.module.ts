import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller.js';
import { HospitalsService } from './hospitals.service.js';

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
