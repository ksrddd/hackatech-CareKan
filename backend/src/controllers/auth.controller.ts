import type { Request, Response } from 'express';
import type { LoginResponse, MeResponse } from '../../../shared/api';
import { prisma } from '../prisma.js';
import { ApiError } from '../errors.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { toUserDto } from '../services/mappers.js';
import { hashPassword, signToken, verifyPassword } from '../services/auth.service.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { nationalId, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { nationalId } });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new ApiError('เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง', 401, 'BAD_CREDENTIALS');
  }
  const token = signToken({ sub: user.id, role: user.role });
  res.json({ user: toUserDto(user), token } satisfies LoginResponse);
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const exists = await prisma.user.findFirst({
    where: { OR: [{ nationalId: body.nationalId }, { email: body.email }] },
  });
  if (exists) throw new ApiError('มีบัญชีนี้อยู่แล้ว', 409, 'DUPLICATE');
  const user = await prisma.user.create({
    data: {
      nationalId: body.nationalId, username: body.nationalId,
      firstName: body.firstName, lastName: body.lastName, phoneNumber: body.phone,
      email: body.email, password: await hashPassword(body.password),
      insuranceRight: 'uc', role: 'citizen', birthDate: body.birthDate,
      sex: body.sex, consentAt: new Date(body.acceptedPdpaAt),
    },
  });
  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ user: toUserDto(user), token } satisfies LoginResponse);
}

export function logout(_req: Request, res: Response): void {
  res.status(204).send(); // JWT is stateless; client drops the token.
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new ApiError('ไม่พบผู้ใช้', 404, 'NOT_FOUND');
  res.json({ user: toUserDto(user) } satisfies MeResponse);
}
