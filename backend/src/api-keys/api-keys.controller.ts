import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import type { ApiKeySubmittedResponse } from '../../../shared/api';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { apiKeyRequestFormSchema } from '../validation/schemas.js';
import { SheetsService } from './sheets.service.js';

type ApiKeyRequestForm = z.infer<typeof apiKeyRequestFormSchema>;

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly sheets: SheetsService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Body(new ZodValidationPipe(apiKeyRequestFormSchema)) form: ApiKeyRequestForm,
  ): Promise<ApiKeySubmittedResponse> {
    await this.sheets.appendRequestToSheet({
      organizationName: form.organizationName,
      staffFullName: form.staffFullName,
      position: form.position,
      organizationEmail: form.organizationEmail,
      contactPhone: form.contactPhone,
      purpose: form.purpose,
      driveLinks: form.driveLinks,
    });
    return { submitted: true };
  }
}
