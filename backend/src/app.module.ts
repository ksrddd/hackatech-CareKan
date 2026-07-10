import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HospitalApiModule } from './hospital-api/hospital-api.module.js';
import { validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { HospitalsModule } from './hospitals/hospitals.module.js';
import { LineModule } from './line/line.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    HospitalsModule,
    AppointmentsModule,
    HospitalApiModule,
    ApiKeysModule,
    LineModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
