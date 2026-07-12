import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateSignature } from '@line/bot-sdk';
import type { Request } from 'express';
import { ApiError } from '../common/errors/api-error.js';

/**
 * ตรวจ x-line-signature จาก raw body — แทน middleware() ของ @line/bot-sdk
 * ที่ backend เดิม mount ก่อน express.json() (Nest ให้ raw body ผ่าน rawBody: true)
 */
@Injectable()
export class LineSignatureGuard implements CanActivate {
  private readonly channelSecret: string;

  constructor(config: ConfigService) {
    this.channelSecret = config.get<string>('LINE_CHANNEL_SECRET') ?? '';
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const signature = req.headers['x-line-signature'];
    if (!this.channelSecret || typeof signature !== 'string' || !req.rawBody) {
      throw new ApiError('invalid signature', 401, 'LINE_SIGNATURE');
    }
    if (!validateSignature(req.rawBody, this.channelSecret, signature)) {
      throw new ApiError('invalid signature', 401, 'LINE_SIGNATURE');
    }
    return true;
  }
}
