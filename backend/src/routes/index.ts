import { Router } from 'express';
import { asyncHandler } from '../errors.js';
import { authGuard } from '../middleware/auth.js';
import { hospitalKeyAuth } from '../middleware/hospitalKeyAuth.js';
import * as auth from '../controllers/auth.controller.js';
import * as hospital from '../controllers/hospital.controller.js';
import * as appt from '../controllers/appointment.controller.js';
import * as apiKey from '../controllers/apiKey.controller.js';
import * as hospitalReserve from '../controllers/hospitalReserve.controller.js';

export const router = Router();

router.post('/auth/register', asyncHandler(auth.register));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authGuard, asyncHandler(auth.me));

router.get('/hospitals', asyncHandler(hospital.list));
router.get('/hospitals/:id', asyncHandler(hospital.detail));
router.get('/hospitals/:id/time-slots', asyncHandler(hospital.timeSlots));

router.post('/appointments', authGuard, asyncHandler(appt.create));
router.get('/appointments/me', authGuard, asyncHandler(appt.mine));
router.get('/appointments/:id', authGuard, asyncHandler(appt.detail));

// ── API key request form (citizen-facing) ─────────────────────────
router.post('/api-keys/requests', authGuard, asyncHandler(apiKey.submit));

// ── Hospital API (hospital key-protected) ─────────────────────────
router.post(
  '/hospital/reserves',
  asyncHandler(hospitalKeyAuth),
  asyncHandler(hospitalReserve.createReserve),
);
router.patch(
  '/hospital/reserves/:id/status',
  asyncHandler(hospitalKeyAuth),
  asyncHandler(hospitalReserve.updateReserveStatus),
);
