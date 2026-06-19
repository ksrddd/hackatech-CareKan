import type { Request, Response } from 'express';
import type { AppointmentResponse, MyAppointmentsResponse } from '../../../shared/api';
import { createAppointmentSchema } from '../validation/schemas.js';
import * as svc from '../services/appointment.service.js';

export async function create(req: Request, res: Response): Promise<void> {
  const input = createAppointmentSchema.parse(req.body);
  const appointment = await svc.createAppointment(req.user!.id, input);
  res.status(201).json({ appointment } satisfies AppointmentResponse);
}

export async function mine(req: Request, res: Response): Promise<void> {
  res.json(await svc.getMyAppointments(req.user!.id) satisfies MyAppointmentsResponse);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] ?? '';
  const appointment = await svc.getAppointmentForOwner(id, req.user!.id);
  res.json({ appointment } satisfies AppointmentResponse);
}

export async function qr_check(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] ?? '';
  const appointment = await svc.getQrAppointment(id);
  res.json({ appointment } satisfies AppointmentResponse);
}

