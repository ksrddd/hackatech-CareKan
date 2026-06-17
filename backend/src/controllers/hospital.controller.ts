import type { Request, Response } from 'express';
import type { HospitalsResponse, HospitalDetailResponse, TimeSlotsResponse } from '../../../shared/api';
import { hospitalsQuerySchema, timeSlotsQuerySchema } from '../validation/schemas.js';
import * as svc from '../services/hospital.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const q = hospitalsQuerySchema.parse(req.query);
  res.json({ hospitals: await svc.listHospitals(q) } satisfies HospitalsResponse);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] ?? '';
  const result = await svc.getHospitalDetail(id);
  res.json(result satisfies HospitalDetailResponse);
}

export async function timeSlots(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] ?? '';
  const { date, clinic } = timeSlotsQuerySchema.parse(req.query);
  res.json({ slots: await svc.listTimeSlots(id, date, clinic) } satisfies TimeSlotsResponse);
}
