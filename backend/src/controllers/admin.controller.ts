import type { Request, Response } from 'express';
import type { AdminQueueResponse, AppointmentResponse } from '../../../shared/api';
import { adminQuerySchema, updateStatusSchema } from '../validation/schemas.js';
import * as svc from '../services/appointment.service.js';

export async function queue(req: Request, res: Response): Promise<void> {
  const query = adminQuerySchema.parse(req.query);
  res.json({ appointments: await svc.getAdminQueue(query) } satisfies AdminQueueResponse);
}

export async function setStatus(req: Request, res: Response): Promise<void> {
  const { status } = updateStatusSchema.parse(req.body);
  const appointment = await svc.updateStatus(req.params['id'] as string, status);
  res.json({ appointment } satisfies AppointmentResponse);
}
