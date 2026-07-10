import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createHmac } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { makeNestApp } from './nest-helpers.js';

// ต้องตรงกับ LINE_CHANNEL_SECRET ใน .env.test
const SECRET = process.env.LINE_CHANNEL_SECRET ?? '';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('base64');
}

describe('POST /line/webhook', () => {
  let nestApp: INestApplication;
  let app: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    nestApp = await makeNestApp();
    app = nestApp.getHttpServer();
  });
  afterAll(async () => { await nestApp.close(); });

  it('is mounted outside the /api prefix', async () => {
    const res = await request(app).post('/api/line/webhook').send({ events: [] });
    expect(res.status).toBe(404);
  });

  it('rejects a missing signature with 401', async () => {
    const res = await request(app)
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .send({ events: [] });
    expect(res.status).toBe(401);
  });

  it('rejects a wrong signature with 401', async () => {
    const body = JSON.stringify({ events: [] });
    const res = await request(app)
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', sign(body + 'tampered'))
      .send(body);
    expect(res.status).toBe(401);
  });

  it('accepts a correctly signed webhook (LINE Verify sends empty events)', async () => {
    const body = JSON.stringify({ events: [] });
    const res = await request(app)
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', sign(body))
      .send(body);
    expect(res.status).toBe(200);
  });
});
