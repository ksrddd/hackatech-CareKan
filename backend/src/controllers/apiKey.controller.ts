import type { Request, Response } from 'express';
import type { ApiKeySubmittedResponse } from '../../../shared/api.js';
import { apiKeyRequestFormSchema } from '../validation/schemas.js';
import { appendRequestToSheet } from '../services/sheets.service.js';

export async function submit(req: Request, res: Response): Promise<void> {
  const form = apiKeyRequestFormSchema.parse(req.body);
  await appendRequestToSheet({
    organizationName: form.organizationName,
    staffFullName: form.staffFullName,
    position: form.position,
    organizationEmail: form.organizationEmail,
    contactPhone: form.contactPhone,
    purpose: form.purpose,
    driveLinks: form.driveLinks,
  });
  res.status(201).json({ submitted: true } satisfies ApiKeySubmittedResponse);
}
