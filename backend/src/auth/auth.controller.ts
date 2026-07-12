import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { LoginRequest, LoginResponse, MeResponse, RegisterRequest } from '../../../shared/api';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard, type RequestUser } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterRequest,
  ): Promise<LoginResponse> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200) // Nest default POST คือ 201 — contract เดิมคือ 200
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginRequest): Promise<LoginResponse> {
    return this.auth.login(body.nationalId, body.password);
  }

  @Post('logout')
  @HttpCode(204)
  logout(): void {
    // stateless JWT — ฝั่ง client เป็นคนทิ้ง token
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser): Promise<MeResponse> {
    return this.auth.me(user.id);
  }
}
