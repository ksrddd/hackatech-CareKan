import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap(): Promise<void> {
  // rawBody: true — LINE webhook ต้องใช้ raw body ไป verify HMAC signature
  const app = await NestFactory.create(AppModule, { rawBody: true });
  configureApp(app);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`CareKan API listening on http://localhost:${port}`);
}

void bootstrap();
