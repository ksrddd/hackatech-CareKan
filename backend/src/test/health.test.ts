import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { makeNestApp } from './nest-helpers.js';

describe('GET /api/health', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await makeNestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'carekan-backend', version: '1.0.0' });
  });

  it('is not double-prefixed as /api/api/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/api/health');
    expect(res.status).toBe(404);
  });
});
