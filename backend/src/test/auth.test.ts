import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeTestApp, resetDb } from './helpers.js';
import { runSeed } from '../../prisma/seed.js';

const prisma = new PrismaClient();
const app = makeTestApp();

beforeAll(async () => { await resetDb(prisma); await runSeed(prisma); });

describe('auth', () => {
  it('logs in the demo citizen and returns a User (no password)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ nationalId: '1234567890123', password: 'care1234' });
    expect(res.status).toBe(200);
    expect(res.body.user.nationalId).toBe('1234567890123');
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['x-auth-token']).toBeUndefined(); // token lives in body, not header
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ nationalId: '1234567890123', password: 'wrongpw' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('registers a new citizen and the token works on /auth/me', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      nationalId: '3111111111115', firstName: 'ทดสอบ', lastName: 'ผู้ใช้',
      birthDate: '1990-01-01', sex: 'male', phone: '0800000000',
      email: 'newuser@example.com', password: 'pass1234',
      acceptedPdpaAt: new Date().toISOString(),
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token as string;
    expect(token).toBeTruthy();
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.nationalId).toBe('3111111111115');
  });

  it('blocks /auth/me without a token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
