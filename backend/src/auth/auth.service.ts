import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginResponse, MeResponse, RegisterRequest } from '../../../shared/api';
import { ApiError } from '../common/errors/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserDto } from '../mappers/mappers.js';

export interface TokenPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.jwtSecret = config.getOrThrow<string>('JWT_SECRET');
  }

  signToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.jwtSecret);
    if (typeof decoded === 'string' || !('sub' in decoded)) {
      throw new Error('Malformed token');
    }
    return { sub: String(decoded.sub) };
  }

  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async login(nationalId: string, password: string): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { nationalId } });
    if (!user || !(await this.verifyPassword(password, user.password))) {
      throw new ApiError('เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง', 401, 'BAD_CREDENTIALS');
    }
    const token = this.signToken({ sub: user.id });
    return { user: toUserDto(user), token };
  }

  async register(body: RegisterRequest): Promise<LoginResponse> {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ nationalId: body.nationalId }, { email: body.email }] },
    });
    if (exists) throw new ApiError('มีบัญชีนี้อยู่แล้ว', 409, 'DUPLICATE');
    const user = await this.prisma.user.create({
      data: {
        nationalId: body.nationalId,
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phone,
        email: body.email,
        password: await this.hashPassword(body.password),
        birthDate: body.birthDate,
        sex: body.sex,
        consentAt: new Date(body.acceptedPdpaAt),
      },
    });
    const token = this.signToken({ sub: user.id });
    return { user: toUserDto(user), token };
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError('ไม่พบผู้ใช้', 404, 'NOT_FOUND');
    return { user: toUserDto(user) };
  }
}
